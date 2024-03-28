use anchor_lang::{prelude::*, solana_program::sysvar};

use crate::{
    approve_asset_collection_delegate, cmp_pubkeys, constants::AUTHORITY_SEED,
    revoke_asset_collection_delegate, ApproveAssetDelegateHelperAccounts, CandyError, CandyMachine,
    RevokeAssetDelegateHelperAccounts,
};

pub fn set_collection_v2(ctx: Context<SetCollectionV2>) -> Result<()> {
    let accounts = ctx.accounts;
    let candy_machine = &mut accounts.candy_machine;

    // check whether the new collection mint is the same as the current collection; when they
    // are the same, we are just using this instruction to update the collection delegate so
    // we don't enforce the "mint in progress" constraint
    if !cmp_pubkeys(accounts.new_collection.key, &candy_machine.collection_mint) {
        if candy_machine.items_redeemed > 0 {
            return err!(CandyError::NoChangingCollectionDuringMint);
        } else if !cmp_pubkeys(accounts.collection.key, &candy_machine.collection_mint) {
            return err!(CandyError::MintMismatch);
        }

        candy_machine.collection_mint = accounts.new_collection.key();
    }

    // revoking the existing metadata delegate

    let revoke_accounts = RevokeAssetDelegateHelperAccounts {
        mpl_core_program: accounts.mpl_core_program.to_account_info(),
        authority_pda: accounts.authority_pda.to_account_info(),
        collection: accounts.collection.to_account_info(),
        payer: accounts.payer.to_account_info(),
        system_program: accounts.system_program.to_account_info(),
        sysvar_instructions: accounts.sysvar_instructions.to_account_info(),
    };

    revoke_asset_collection_delegate(
        revoke_accounts,
        candy_machine.key(),
        *ctx.bumps.get("authority_pda").unwrap(),
    )?;

    let delegate_accounts = ApproveAssetDelegateHelperAccounts {
        payer: accounts.payer.to_account_info(),
        authority_pda: accounts.authority_pda.to_account_info(),
        collection: accounts.new_collection.to_account_info(),
        collection_update_authority: accounts.new_collection_update_authority.to_account_info(),
        system_program: accounts.system_program.to_account_info(),
        sysvar_instructions: accounts.sysvar_instructions.to_account_info(),
        mpl_core_program: accounts.mpl_core_program.to_account_info(),
    };

    approve_asset_collection_delegate(delegate_accounts)
}

/// Sets the collection PDA for the candy machine.
#[derive(Accounts)]
pub struct SetCollectionV2<'info> {
    /// Candy Machine account.
    #[account(mut, has_one = authority)]
    candy_machine: Box<Account<'info, CandyMachine>>,

    /// Candy Machine authority.
    authority: Signer<'info>,

    /// Authority PDA.
    ///
    /// CHECK: account checked in seeds constraint
    #[account(
        mut,
        seeds = [AUTHORITY_SEED.as_bytes(), candy_machine.to_account_info().key.as_ref()],
        bump
    )]
    authority_pda: UncheckedAccount<'info>,

    /// Payer of the transaction.
    #[account(mut)]
    payer: Signer<'info>,

    /// Update authority of the collection.
    ///
    /// CHECK: account checked in CPI
    collection_update_authority: UncheckedAccount<'info>,

    /// Mint account of the collection.
    ///
    /// CHECK: account checked in CPI
    #[account(mut)]
    collection: UncheckedAccount<'info>,

    /// Update authority of the new collection NFT.
    new_collection_update_authority: Signer<'info>,

    /// New collection mint.
    ///
    /// CHECK: account checked in CPI
    #[account(mut)]
    new_collection: UncheckedAccount<'info>,

    /// Token Metadata program.
    ///
    /// CHECK: account checked in CPI
    #[account(address = mpl_core::ID)]
    mpl_core_program: UncheckedAccount<'info>,

    /// System program.
    system_program: Program<'info, System>,

    /// Instructions sysvar account.
    ///
    /// CHECK: account constraints checked in account trait
    #[account(address = sysvar::instructions::id())]
    sysvar_instructions: UncheckedAccount<'info>,
}
