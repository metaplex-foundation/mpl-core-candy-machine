use mpl_core::instructions::TransferV1CpiBuilder;

use super::*;

use crate::{state::GuardType, utils::assert_keys_equal};

/// Guard that requires a specific number of Assets from a specific collection to be used as payment.
///
/// List of accounts required:
///
///   0. `[writeable]` Address of the collection.
///   1. `[writeable]` Address of the destination.
///   x. `[writeable]` Address of the Asset(s).
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct AssetPaymentMulti {
    pub required_collection: Pubkey,
    pub destination: Pubkey,
    pub num: u8,
}

impl Guard for AssetPaymentMulti {
    fn size() -> usize {
        32 // required_collection
        + 32 // destination
        + 1 // num of assets to burn
    }

    fn mask() -> u64 {
        GuardType::as_mask(GuardType::AssetPaymentMulti)
    }
}

impl Condition for AssetPaymentMulti {
    fn validate<'info>(
        &self,
        ctx: &mut EvaluationContext,
        _guard_set: &GuardSet,
        _mint_args: &[u8],
    ) -> Result<()> {
        let index = ctx.account_cursor;
        let _collection_account = try_get_account_info(ctx.accounts.remaining, index)?;
        let destination_account = try_get_account_info(ctx.accounts.remaining, index + 1)?;
        ctx.account_cursor += 2;

        let mut i: usize = 0;
        let mut asset_account;
        let mut asset;
        let mut asset_collection;

        assert_keys_equal(&destination_account.key(), &self.destination)?;

        while i < usize::from(self.num) {
            asset_account = try_get_account_info(ctx.accounts.remaining, index + i + 2)?;

            asset = Asset::try_from(asset_account)?;
            asset_collection = match asset.base.update_authority {
                UpdateAuthority::Collection(pubkey) => Some(pubkey),
                _ => None,
            };

            if asset_collection.is_none() {
                return err!(CandyGuardError::InvalidNftCollection);
            }

            if assert_keys_equal(&asset_collection.unwrap(), &self.required_collection).is_err() {
                return err!(CandyGuardError::InvalidNftCollection);
            }

            if assert_keys_equal(&asset.base.owner, ctx.accounts.minter.key).is_err() {
                return err!(CandyGuardError::IncorrectOwner);
            }

            i += 1;
        }

        ctx.account_cursor += usize::from(self.num);

        ctx.indices.insert("asset_burn_multi_index", index);

        Ok(())
    }

    fn pre_actions<'info>(
        &self,
        ctx: &mut EvaluationContext,
        _guard_set: &GuardSet,
        _mint_args: &[u8],
    ) -> Result<()> {
        let index = ctx.indices["asset_burn_multi_index"];
        let collection_account = try_get_account_info(ctx.accounts.remaining, index)?;
        let destination_account = try_get_account_info(ctx.accounts.remaining, index + 1)?;

        let mut asset_account = Box::<&AccountInfo>::new(collection_account);

        let mut i: usize = 0;
        while i < usize::from(self.num) {
            *asset_account = try_get_account_info(ctx.accounts.remaining, index + i + 2)?;

            TransferV1CpiBuilder::new(&ctx.accounts.mpl_core_program)
                .collection(Some(collection_account))
                .asset(&asset_account)
                .authority(Some(&ctx.accounts.minter))
                .new_owner(destination_account)
                .payer(&ctx.accounts.minter)
                .invoke()?;

            i += 1;
        }
        Ok(())
    }
}
