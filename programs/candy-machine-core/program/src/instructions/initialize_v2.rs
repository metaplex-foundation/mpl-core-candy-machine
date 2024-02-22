use anchor_lang::{prelude::*, solana_program::sysvar, Discriminator};
use mpl_token_metadata::{types::TokenStandard, MAX_SYMBOL_LENGTH};
use mpl_utils::resize_or_reallocate_account_raw;

use crate::{
    approve_metadata_delegate, assert_token_standard,
    constants::{
        AUTHORITY_SEED, HIDDEN_SECTION, RULE_SET_LENGTH, SET,
    },
    state::{CandyMachine, CandyMachineData},
    utils::fixed_length_string,
    AccountVersion, ApproveMetadataDelegateHelperAccounts,
};

pub fn initialize_v2(
    ctx: Context<InitializeV2>,
    data: CandyMachineData,
    token_standard: u8,
) -> Result<()> {
    // make sure we got a valid token standard
    assert_token_standard(token_standard)?;

    let required_length = data.get_space_for_candy()?;

    if token_standard == TokenStandard::ProgrammableNonFungible as u8
        && ctx.accounts.candy_machine.data_len() < (required_length + RULE_SET_LENGTH + 1)
    {
        msg!("Allocating space to store the rule set");

        resize_or_reallocate_account_raw(
            &ctx.accounts.candy_machine.to_account_info(),
            &ctx.accounts.payer.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            required_length + (1 + RULE_SET_LENGTH),
        )?;
    }

    let candy_machine_account = &mut ctx.accounts.candy_machine;

    let mut candy_machine = CandyMachine {
        data,
        version: AccountVersion::V2,
        features: [0u8; 6],
        authority: ctx.accounts.authority.key(),
        mint_authority: ctx.accounts.authority.key(),
        collection_mint: ctx.accounts.collection.key(),
        items_redeemed: 0,
    };

    candy_machine.data.symbol = fixed_length_string(candy_machine.data.symbol, MAX_SYMBOL_LENGTH)?;
    // validates the config lines settings
    candy_machine.data.validate()?;

    let mut struct_data = CandyMachine::discriminator().try_to_vec().unwrap();
    struct_data.append(&mut candy_machine.try_to_vec().unwrap());

    let mut account_data = candy_machine_account.data.borrow_mut();
    account_data[0..struct_data.len()].copy_from_slice(&struct_data);

    if candy_machine.data.hidden_settings.is_none() {
        // set the initial number of config lines
        account_data[HIDDEN_SECTION..HIDDEN_SECTION + 4].copy_from_slice(&u32::MIN.to_le_bytes());
    }

    // TODO approve collection delegate to mint to collection
    // approves the metadata delegate so the candy machine can verify minted NFTs
    // let delegate_accounts = ApproveMetadataDelegateHelperAccounts {
    //     token_metadata_program: ctx.accounts.token_metadata_program.to_account_info(),
    //     authority_pda: ctx.accounts.authority_pda.to_account_info(),
    //     collection_metadata: ctx.accounts.collection_metadata.to_account_info(),
    //     collection_mint: ctx.accounts.collection_mint.to_account_info(),
    //     collection_update_authority: ctx.accounts.collection_update_authority.to_account_info(),
    //     delegate_record: ctx.accounts.collection_delegate_record.to_account_info(),
    //     payer: ctx.accounts.payer.to_account_info(),
    //     system_program: ctx.accounts.system_program.to_account_info(),
    //     sysvar_instructions: ctx.accounts.sysvar_instructions.to_account_info(),
    //     authorization_rules_program: ctx
    //         .accounts
    //         .authorization_rules_program
    //         .as_ref()
    //         .map(|authorization_rules_program| authorization_rules_program.to_account_info()),
    //     authorization_rules: ctx
    //         .accounts
    //         .authorization_rules
    //         .as_ref()
    //         .map(|authorization_rules| authorization_rules.to_account_info()),
    // };

    // approve_metadata_delegate(delegate_accounts)
    Ok(())
}

/// Initializes a new candy machine.
#[derive(Accounts)]
#[instruction(data: CandyMachineData, token_standard: u8)]
pub struct InitializeV2<'info> {
    /// Candy Machine account. The account space must be allocated to allow accounts larger
    /// than 10kb.
    ///
    /// CHECK: account constraints checked in account trait
    #[account(
        zero,
        rent_exempt = skip,
        constraint = candy_machine.to_account_info().owner == __program_id && candy_machine.to_account_info().data_len() >= data.get_space_for_candy()?
    )]
    candy_machine: UncheckedAccount<'info>,

    /// Authority PDA used to verify minted NFTs to the collection.
    ///
    /// CHECK: account checked in seeds constraint
    #[account(
        mut,
        seeds = [AUTHORITY_SEED.as_bytes(), candy_machine.to_account_info().key.as_ref()],
        bump
    )]
    authority_pda: UncheckedAccount<'info>,

    /// Candy Machine authority. This is the address that controls the upate of the candy machine.
    ///
    /// CHECK: authority can be any account and is not written to or read
    authority: UncheckedAccount<'info>,

    /// Payer of the transaction.
    #[account(mut)]
    payer: Signer<'info>,

    /// Mint account of the collection.
    ///
    /// CHECK: account checked in CPI
    collection: UncheckedAccount<'info>,

    /// Update authority of the collection. This needs to be a signer so the candy
    /// machine can approve a delegate to verify minted NFTs to the collection.
    #[account(mut)]
    collection_update_authority: Signer<'info>,

    /// Token Metadata program.
    ///
    /// CHECK: account constraint checked in account trait
    #[account(address = mpl_asset::ID)]
    asset_program: UncheckedAccount<'info>,

    /// System program.
    system_program: Program<'info, System>,

    /// Instructions sysvar account.
    ///
    /// CHECK: account constraint checked in account trait
    #[account(address = sysvar::instructions::id())]
    sysvar_instructions: UncheckedAccount<'info>,

}
