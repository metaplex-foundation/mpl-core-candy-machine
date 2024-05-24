use anchor_lang::{prelude::*, solana_program::sysvar};
use mpl_core::instructions::TransferV1CpiBuilder;

pub fn transfer_test<'info>(
    ctx: Context<'_, '_, '_, 'info, TransferTest<'info>>,
    _mint_args: Vec<u8>,
    _label: Option<String>,
) -> Result<()> {
    let mut builder = TransferV1CpiBuilder::new(&ctx.accounts.mpl_core_program);
    builder
        .asset(&ctx.accounts.asset)
        .collection(Some(&ctx.accounts.collection))
        .payer(&ctx.accounts.payer);

    for _x in 0..20 {
        builder
            .new_owner(&ctx.accounts.recipient)
            .authority(Some(&ctx.accounts.payer))
            .invoke()?;
        builder
            .new_owner(&ctx.accounts.payer)
            .authority(Some(&ctx.accounts.recipient))
            .invoke()?;
    }

    Ok(())
}

/// Mint an NFT.
#[derive(Accounts)]
pub struct TransferTest<'info> {
    /// Payer for the mint (SOL) fees.
    #[account(mut)]
    payer: Signer<'info>,

    /// Minter account for validation and non-SOL fees.
    #[account(mut)]
    recipient: Signer<'info>,

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

    /// mpl core
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
