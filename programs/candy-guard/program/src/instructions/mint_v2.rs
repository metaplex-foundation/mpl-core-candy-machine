use std::collections::BTreeMap;

use anchor_lang::{prelude::*, solana_program::sysvar, Discriminator};
use mpl_core_candy_machine_core::CandyMachine;
use solana_program::{instruction::Instruction, program::invoke_signed};

use crate::{
    guards::{CandyGuardError, EvaluationContext},
    state::{CandyGuard, CandyGuardData, GuardSet, DATA_OFFSET, SEED},
    utils::cmp_pubkeys,
};

use super::MintAccounts;

pub fn mint_v2<'info>(
    ctx: Context<'_, '_, '_, 'info, MintV2<'info>>,
    mint_args: Vec<u8>,
    label: Option<String>,
) -> Result<()> {
    let owner_info = if let Some(owner) = ctx.accounts.owner.as_ref() {
        owner.to_account_info()
    } else {
        ctx.accounts.minter.to_account_info()
    };

    let accounts = MintAccounts {
        candy_guard: &ctx.accounts.candy_guard,
        candy_machine: &ctx.accounts.candy_machine,
        candy_machine_authority_pda: ctx.accounts.candy_machine_authority_pda.to_account_info(),
        _candy_machine_program: ctx.accounts.candy_machine_program.to_account_info(),
        collection: ctx.accounts.collection.to_account_info(),
        asset: ctx.accounts.asset.to_account_info(),
        payer: ctx.accounts.payer.to_account_info(),
        minter: ctx.accounts.minter.to_account_info(),
        owner: owner_info,
        recent_slothashes: ctx.accounts.recent_slothashes.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        sysvar_instructions: ctx.accounts.sysvar_instructions.to_account_info(),
        mpl_core_program: ctx.accounts.mpl_core_program.to_account_info(),
        remaining: ctx.remaining_accounts,
    };

    // evaluation context for this transaction
    let mut ctx = EvaluationContext {
        accounts,
        account_cursor: 0,
        args_cursor: 0,
        indices: BTreeMap::new(),
        plugins: vec![],
    };

    process_mint(&mut ctx, mint_args, label)
}

pub fn process_mint(
    ctx: &mut EvaluationContext<'_, '_, '_>,
    mint_args: Vec<u8>,
    label: Option<String>,
) -> Result<()> {
    let account_info = ctx.accounts.candy_guard.to_account_info();
    let account_data = account_info.data.borrow();
    // loads the active guard set
    let guard_set = match CandyGuardData::active_set(&account_data[DATA_OFFSET..], label) {
        Ok(guard_set) => guard_set,
        Err(error) => {
            // load the default guard set to look for the bot_tax since errors only occur
            // when trying to load guard set groups
            let guard_set = CandyGuardData::load(&account_data[DATA_OFFSET..])?;
            return process_error(ctx, &guard_set.default, error);
        }
    };

    let conditions = guard_set.enabled_conditions();

    // validates the required transaction data

    if let Err(error) = validate(ctx) {
        return process_error(ctx, &guard_set, error);
    }

    // validates enabled guards (any error at this point is subject to bot tax)

    for condition in &conditions {
        if let Err(error) = condition.validate(ctx, &guard_set, &mint_args) {
            return process_error(ctx, &guard_set, error);
        }
    }

    // after this point, errors might occur, which will cause the transaction to fail
    // no bot tax from this point since the actions must be reverted in case of an error

    for condition in &conditions {
        condition.pre_actions(ctx, &guard_set, &mint_args)?;
    }

    cpi_mint(ctx)?;

    for condition in &conditions {
        condition.post_actions(ctx, &guard_set, &mint_args)?;
    }

    Ok(())
}

// Handles errors + bot tax charge.
fn process_error(ctx: &EvaluationContext, guard_set: &GuardSet, error: Error) -> Result<()> {
    if let Some(bot_tax) = &guard_set.bot_tax {
        bot_tax.punish_bots(ctx, error)?;
        Ok(())
    } else {
        Err(error)
    }
}

/// Performs a validation of the transaction before executing the guards.
fn validate(ctx: &EvaluationContext) -> Result<()> {
    if !cmp_pubkeys(
        &ctx.accounts.collection.key(),
        &ctx.accounts.candy_machine.collection_mint,
    ) {
        return err!(CandyGuardError::CollectionKeyMismatch);
    }

    if !cmp_pubkeys(ctx.accounts.collection.owner, &mpl_core::ID) {
        return err!(CandyGuardError::IncorrectOwner);
    }

    Ok(())
}

/// Send a mint transaction to the candy machine.
fn cpi_mint(ctx: &EvaluationContext) -> Result<()> {
    let candy_guard = &ctx.accounts.candy_guard;

    // candy machine mint instruction accounts
    let mint_accounts = Box::new(mpl_core_candy_machine_core::cpi::accounts::MintAsset {
        candy_machine: ctx.accounts.candy_machine.to_account_info(),
        authority_pda: ctx.accounts.candy_machine_authority_pda.clone(),
        mint_authority: candy_guard.to_account_info(),
        payer: ctx.accounts.payer.clone(),
        asset_owner: ctx.accounts.owner.clone(),
        asset: ctx.accounts.asset.clone(),
        collection: ctx.accounts.collection.clone(),
        mpl_core_program: ctx.accounts.mpl_core_program.clone(),
        system_program: ctx.accounts.system_program.clone(),
        sysvar_instructions: ctx.accounts.sysvar_instructions.clone(),
        recent_slothashes: ctx.accounts.recent_slothashes.clone(),
    });

    let mint_infos = mint_accounts.to_account_infos();
    let mut mint_metas = mint_accounts.to_account_metas(None);

    mint_metas.iter_mut().for_each(|account_meta| {
        if account_meta.pubkey == ctx.accounts.asset.key() {
            account_meta.is_signer = ctx.accounts.asset.is_signer;
        }
    });

    let args = mpl_core_candy_machine_core::instruction::MintAsset {
        args: mpl_core_candy_machine_core::MintAssetArgs {
            plugins: ctx.plugins.to_vec(),
        },
    };
    let arg_data = args.try_to_vec()?;

    let data = mpl_core_candy_machine_core::instruction::MintAsset::DISCRIMINATOR
        .to_vec()
        .iter()
        .cloned()
        .chain(arg_data.iter().cloned())
        .collect();

    let mint_ix = Instruction {
        program_id: mpl_core_candy_machine_core::ID,
        accounts: mint_metas,
        data,
    };

    // PDA signer for the transaction
    let seeds = [SEED, &candy_guard.base.to_bytes(), &[candy_guard.bump]];
    let signer = [&seeds[..]];

    invoke_signed(&mint_ix, &mint_infos, &signer)?;

    Ok(())
}

/// Mint an NFT.
#[derive(Accounts)]
pub struct MintV2<'info> {
    /// Candy Guard account.
    #[account(seeds = [SEED, candy_guard.base.key().as_ref()], bump = candy_guard.bump)]
    candy_guard: Account<'info, CandyGuard>,

    /// Candy Machine program account.
    ///
    /// CHECK: account constraints checked in account trait
    #[account(address = mpl_core_candy_machine_core::id())]
    candy_machine_program: AccountInfo<'info>,

    /// Candy machine account.
    #[account(mut, constraint = candy_guard.key() == candy_machine.mint_authority)]
    candy_machine: Box<Account<'info, CandyMachine>>,

    /// Candy Machine authority account.
    ///
    /// CHECK: account constraints checked in CPI
    #[account(mut)]
    candy_machine_authority_pda: UncheckedAccount<'info>,

    /// Payer for the mint (SOL) fees.
    #[account(mut)]
    payer: Signer<'info>,

    /// Minter account for validation and non-SOL fees.
    #[account(mut)]
    minter: Signer<'info>,

    /// Optionally mint to different owner
    owner: Option<UncheckedAccount<'info>>,

    /// Mint account of the NFT. The account will be initialized if necessary.
    ///
    /// Must be a signer if:
    ///   * the nft_mint account does not exist.
    ///
    /// CHECK: account checked in CPI
    #[account(mut)]
    asset: UncheckedAccount<'info>,

    /// Mint account of the collection NFT.
    ///
    /// CHECK: account checked in CPI
    #[account(mut)]
    collection: UncheckedAccount<'info>,

    /// Token Metadata program.
    ///
    /// CHECK: account checked in CPI
    // #[account(address = mpl_token_metadata::ID)]
    // token_metadata_program: Option<UncheckedAccount<'info>>,

    /// Token Metadata program.
    ///
    /// CHECK: account checked in CPI
    #[account(address = mpl_core::ID)]
    mpl_core_program: UncheckedAccount<'info>,

    /// SPL Token program.
    // spl_token_program: Program<'info, Token>,

    /// System program.
    system_program: Program<'info, System>,

    /// Instructions sysvar account.
    ///
    /// CHECK: account constraints checked in account trait
    #[account(address = sysvar::instructions::id())]
    sysvar_instructions: UncheckedAccount<'info>,

    /// SlotHashes sysvar cluster data.
    ///
    /// CHECK: account constraints checked in account trait
    #[account(address = sysvar::slot_hashes::id())]
    recent_slothashes: UncheckedAccount<'info>,
}
