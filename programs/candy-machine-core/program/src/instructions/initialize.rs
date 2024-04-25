use anchor_lang::{prelude::*, solana_program::sysvar, Discriminator};

use crate::{
    approve_asset_collection_delegate,
    constants::{AUTHORITY_SEED, HIDDEN_SECTION},
    state::{CandyMachine, CandyMachineData},
    ApproveAssetDelegateHelperAccounts,
};

pub fn initialize(ctx: Context<Initialize>, data: CandyMachineData) -> Result<()> {
    let candy_machine_account = &mut ctx.accounts.candy_machine;

    let candy_machine = CandyMachine {
        data,
        authority: ctx.accounts.authority.key(),
        mint_authority: ctx.accounts.authority.key(),
        collection_mint: ctx.accounts.collection.key(),
        items_redeemed: 0,
    };

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

    let delegate_accounts = ApproveAssetDelegateHelperAccounts {
        payer: ctx.accounts.payer.to_account_info(),
        authority_pda: ctx.accounts.authority_pda.to_account_info(),
        collection: ctx.accounts.collection.to_account_info(),
        collection_update_authority: ctx.accounts.collection_update_authority.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        sysvar_instructions: ctx.accounts.sysvar_instructions.to_account_info(),
        mpl_core_program: ctx.accounts.mpl_core_program.to_account_info(),
    };

    approve_asset_collection_delegate(delegate_accounts)
}

/// Initializes a new candy machine.
#[derive(Accounts)]
#[instruction(data: CandyMachineData)]
pub struct Initialize<'info> {
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

    /// Authority PDA used to verify Assets created to the collection.
    ///
    /// CHECK: account checked in seeds constraint
    #[account(
        mut,
        seeds = [AUTHORITY_SEED.as_bytes(), candy_machine.to_account_info().key.as_ref()],
        bump
    )]
    authority_pda: UncheckedAccount<'info>,

    /// Candy Machine authority. This is the address that controls the update of the candy machine.
    ///
    /// CHECK: authority can be any account and is not written to or read
    authority: UncheckedAccount<'info>,

    /// Payer of the transaction.
    #[account(mut)]
    payer: Signer<'info>,

    /// Account of the collection.
    ///
    /// CHECK: account checked in CPI
    #[account(mut)]
    collection: UncheckedAccount<'info>,

    /// Update authority of the collection. This needs to be a signer so the candy
    /// machine can approve a delegate to verify minted Assets to the collection.
    #[account(mut)]
    collection_update_authority: Signer<'info>,

    /// Token Metadata program.
    ///
    /// CHECK: account constraint checked in account trait
    #[account(address = mpl_core::ID)]
    mpl_core_program: UncheckedAccount<'info>,

    /// System program.
    system_program: Program<'info, System>,

    /// Instructions sysvar account.
    ///
    /// CHECK: account constraint checked in account trait
    #[account(address = sysvar::instructions::id())]
    sysvar_instructions: UncheckedAccount<'info>,
}
