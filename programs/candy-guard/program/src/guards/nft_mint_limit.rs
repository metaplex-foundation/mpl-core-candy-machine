use std::collections::HashSet;

use mpl_token_metadata::accounts::Metadata;
use solana_program::{program::invoke_signed, system_instruction};

use super::*;
use crate::{
    state::GuardType,
    utils::{assert_keys_equal, assert_owned_by},
};

/// Gaurd to set a limit of mints per wallet based on holding a specific NFT.
///
/// List of accounts required:
///
///   0. `[writable]` Creation counter PDA. The PDA is derived
///                   using the seed `["nft_mint_limit", nft mint guard id, Asset key,
///                   candy guard pubkey, candy machine pubkey]`.
///   1. `[]` Token account of the NFT.
///   2. `[]` Metadata account of the NFT.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct NftMintLimit {
    /// Unique identifier of the mint limit.
    pub id: u8,
    /// Limit of mints per individual aset address.
    pub limit: u16,
    /// Required collection of the asset.
    pub required_collection: Pubkey,
}

impl Guard for NftMintLimit {
    fn size() -> usize {
        1    // id
        + 2  // limit
        + 32 // required_collection
    }

    fn mask() -> u64 {
        GuardType::as_mask(GuardType::NftMintLimit)
    }

    fn verify(data: &CandyGuardData) -> Result<()> {
        let mut ids = HashSet::new();

        if let Some(nft_mint_limit) = &data.default.nft_mint_limit {
            ids.insert(nft_mint_limit.id);
        }

        if let Some(groups) = &data.groups {
            for group in groups {
                if let Some(nft_mint_limit) = &group.guards.nft_mint_limit {
                    if ids.contains(&nft_mint_limit.id) {
                        return err!(CandyGuardError::DuplicatedMintLimitId);
                    }

                    ids.insert(nft_mint_limit.id);
                }
            }
        }

        Ok(())
    }
}

impl Condition for NftMintLimit {
    fn validate<'info>(
        &self,
        ctx: &mut EvaluationContext,
        _guard_set: &GuardSet,
        _mint_args: &[u8],
    ) -> Result<()> {
        let index = ctx.account_cursor;
        let counter = try_get_account_info(ctx.accounts.remaining, index)?;
        let nft_account = try_get_account_info(ctx.accounts.remaining, index + 1)?;
        let nft_metadata = try_get_account_info(ctx.accounts.remaining, index + 2)?;
        ctx.indices
            .insert("nft_mint_limit_index", ctx.account_cursor);
        ctx.account_cursor += 3;

        // verifies that we got the correct NFT
        NftGate::verify_collection(
            nft_account,
            nft_metadata,
            &self.required_collection,
            ctx.accounts.minter.key,
        )?;

        let candy_guard_key = &ctx.accounts.candy_guard.key();
        let candy_machine_key = &ctx.accounts.candy_machine.key();

        let metadata: Metadata = Metadata::try_from(nft_metadata)?;
        let mint_key = metadata.mint.key();

        let seeds = [
            NftMintCounter::PREFIX_SEED,
            &[self.id],
            mint_key.as_ref(),
            candy_guard_key.as_ref(),
            candy_machine_key.as_ref(),
        ];
        let (pda, _) = Pubkey::find_program_address(&seeds, &crate::ID);

        assert_keys_equal(counter.key, &pda)?;

        if !counter.data_is_empty() {
            // check the owner of the account
            assert_owned_by(counter, &crate::ID)?;

            let account_data = counter.data.borrow();
            let mint_counter = NftMintCounter::try_from_slice(&account_data)?;

            if mint_counter.count >= self.limit {
                return err!(CandyGuardError::AllowedMintLimitReached);
            }
        } else if self.limit < 1 {
            // sanity check: if the limit is set to less than 1 we cannot proceed
            return err!(CandyGuardError::AllowedMintLimitReached);
        }

        Ok(())
    }

    fn pre_actions<'info>(
        &self,
        ctx: &mut EvaluationContext,
        _guard_set: &GuardSet,
        _mint_args: &[u8],
    ) -> Result<()> {
        let index = ctx.indices["nft_mint_limit_index"];
        let counter = try_get_account_info(ctx.accounts.remaining, index)?;
        let nft_metadata = try_get_account_info(ctx.accounts.remaining, index + 2)?;

        if counter.data_is_empty() {
            // let minter = ctx.accounts.minter.key();
            let candy_guard_key = &ctx.accounts.candy_guard.key();
            let candy_machine_key = &ctx.accounts.candy_machine.key();

            let metadata: Metadata = Metadata::try_from(nft_metadata)?;
            let mint_key = metadata.mint.key();

            let seeds = [
                NftMintCounter::PREFIX_SEED,
                &[self.id],
                mint_key.as_ref(),
                candy_guard_key.as_ref(),
                candy_machine_key.as_ref(),
            ];
            let (pda, bump) = Pubkey::find_program_address(&seeds, &crate::ID);

            let rent = Rent::get()?;
            let signer = [
                NftMintCounter::PREFIX_SEED,
                &[self.id],
                mint_key.as_ref(),
                candy_guard_key.as_ref(),
                candy_machine_key.as_ref(),
                &[bump],
            ];

            invoke_signed(
                &system_instruction::create_account(
                    ctx.accounts.payer.key,
                    &pda,
                    rent.minimum_balance(std::mem::size_of::<u16>()),
                    std::mem::size_of::<u16>() as u64,
                    &crate::ID,
                ),
                &[
                    ctx.accounts.payer.to_account_info(),
                    counter.to_account_info(),
                ],
                &[&signer],
            )?;
        } else {
            assert_owned_by(counter, &crate::ID)?;
        }

        let mut account_data = counter.try_borrow_mut_data()?;
        let mut mint_counter = NftMintCounter::try_from_slice(&account_data)?;
        mint_counter.count += 1;
        // saves the changes back to the pda
        let data = &mut mint_counter.try_to_vec().unwrap();
        account_data[0..data.len()].copy_from_slice(data);

        Ok(())
    }
}

/// PDA to track the number of mints for an individual address.
#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct NftMintCounter {
    pub count: u16,
}

impl NftMintCounter {
    /// Prefix used as seed.
    pub const PREFIX_SEED: &'static [u8] = b"nft_mint_limit";
}
