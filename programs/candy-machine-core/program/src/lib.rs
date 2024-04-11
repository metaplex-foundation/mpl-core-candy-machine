#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

pub use errors::CandyError;
use instructions::*;
pub use state::*;
pub use utils::*;

pub mod constants;
pub mod errors;
mod instructions;
mod state;
mod utils;

declare_id!("CMACYFENjoBMHzapRXyo1JZkVS6EtaDDzkjMrmQLvr4J");

#[program]
pub mod candy_machine_core {
    use super::*;

    /// Add the configuration (name + uri) of each NFT to the account data.
    ///
    /// # Accounts
    ///
    ///   0. `[writable]` Candy Machine account
    ///   1. `[signer]` Candy Machine authority
    pub fn add_config_lines(
        ctx: Context<AddConfigLines>,
        index: u32,
        config_lines: Vec<ConfigLine>,
    ) -> Result<()> {
        instructions::add_config_lines(ctx, index, config_lines)
    }

    /// Initialize the candy machine account with the specified data and token standard.
    ///
    /// # Accounts
    ///
    ///   0. `[writable]` Candy Machine account (must be pre-allocated but zero content)
    ///   1. `[writable]` Authority PDA (seeds `["candy_machine", candy machine id]`)
    ///   2. `[]` Candy Machine authority
    ///   3. `[signer]` Payer
    ///   4. `[]` Collection metadata
    ///   5. `[]` Collection mint
    ///   6. `[]` Collection master edition
    ///   7. `[signer]` Collection update authority
    ///   8. `[writable]` Collection metadata delegate record
    ///   9. `[]` Token Metadata program
    ///   10. `[]` System program
    ///   11. `[]` Instructions sysvar account
    ///   12. `[optional]` Token Authorization Rules program
    ///   13. `[optional]` Token authorization rules account
    pub fn initialize_v2(ctx: Context<InitializeV2>, data: CandyMachineData) -> Result<()> {
        instructions::initialize_v2(ctx, data)
    }

    /// Mint an NFT.
    ///
    /// Only the candy machine mint authority is allowed to mint. This handler mints both
    /// NFTs and Programmable NFTs.
    ///
    /// # Accounts
    ///
    ///   0. `[writable]` Candy Machine account (must be pre-allocated but zero content)
    ///   1. `[writable]` Authority PDA (seeds `["candy_machine", candy machine id]`)
    ///   2. `[signer]` Candy Machine mint authority
    ///   3. `[signer]` Payer
    ///   4. `[]` Asset Owner
    ///   5. `[writable]` Asset account
    ///   6. `[]` Collection
    ///   7. `[]` Collection delegate or update authority
    ///   8. `[]` Asset program
    ///   9. `[]` System program
    ///   10. `[optional]` Instructions sysvar account
    ///   11. `[]` SlotHashes sysvar cluster data.
    pub fn mint_asset<'info>(
        ctx: Context<'_, '_, '_, 'info, MintAsset<'info>>,
        args: MintAssetArgs,
    ) -> Result<()> {
        instructions::mint_asset(ctx, args)
    }

    /// Set a new authority of the candy machine.
    ///
    /// # Accounts
    ///
    ///   0. `[writable]` Candy Machine account
    ///   1. `[signer]` Candy Machine authority
    pub fn set_authority(ctx: Context<SetAuthority>, new_authority: Pubkey) -> Result<()> {
        instructions::set_authority(ctx, new_authority)
    }

    /// Set the collection mint for the candy machine.
    ///
    /// # Accounts
    ///
    ///   0. `[writable]` Candy Machine account (must be pre-allocated but zero content)
    ///   1. `[signer]` Candy Machine authority
    ///   2. `[]` Authority PDA (seeds `["candy_machine", candy machine id]`)
    ///   3. `[signer]` Payer
    ///   4. `[]` Collection update authority
    ///   5. `[]` Collection mint
    ///   6. `[]` Collection metadata
    ///   7. `[optional, writable]` Metadata delegate record
    ///   8. `[optional, writable]` Collection authority record
    ///   9. `[signer]` New collection update authority
    ///   10. `[]` New collection mint
    ///   11. `[]` New collection metadata
    ///   12. `[]` New collection master edition
    ///   13. `[writable]` New collection metadata delegate record
    ///   14. `[]` Token Metadata program
    ///   15. `[]` System program
    ///   16. `[]` Instructions sysvar account
    ///   17. `[optional]` Token Authorization Rules program
    ///   18. `[optional]` Token authorization rules account
    pub fn set_collection_v2(ctx: Context<SetCollectionV2>) -> Result<()> {
        instructions::set_collection_v2(ctx)
    }

    /// Set a new mint authority of the candy machine.
    ///
    /// # Accounts
    ///
    ///   0. `[writable]` Candy Machine account
    ///   1. `[signer]` Candy Machine authority
    ///   1. `[signer]` New candy machine authority
    pub fn set_mint_authority(ctx: Context<SetMintAuthority>) -> Result<()> {
        instructions::set_mint_authority(ctx)
    }

    /// Update the candy machine configuration.
    ///
    /// # Accounts
    ///
    ///   0. `[writable]` Candy Machine account
    ///   1. `[signer]` Candy Machine authority
    pub fn update(ctx: Context<Update>, data: CandyMachineData) -> Result<()> {
        instructions::update(ctx, data)
    }

    /// Withdraw the rent lamports and send them to the authority address.
    ///
    /// # Accounts
    ///
    ///   0. `[writable]` Candy Machine account
    ///   1. `[signer]` Candy Machine authority
    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        instructions::withdraw(ctx)
    }
}
