use super::*;

use mpl_core::instructions::BurnV1CpiBuilder;

use crate::{state::GuardType, utils::assert_keys_equal};

/// Guard that requires another Core Asset from a specific collection to be burned.
///
/// List of accounts required:
///
///   0. `[writeable]` Address of the asset.
///   1. `[writeable]` Address of the required collection.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct AssetBurn {
    pub required_collection: Pubkey,
}

impl Guard for AssetBurn {
    fn size() -> usize {
        32 // required_collection
    }

    fn mask() -> u64 {
        GuardType::as_mask(GuardType::AssetBurn)
    }
}

impl Condition for AssetBurn {
    fn validate<'info>(
        &self,
        ctx: &mut EvaluationContext,
        _guard_set: &GuardSet,
        _mint_args: &[u8],
    ) -> Result<()> {
        let index = ctx.account_cursor;
        // validates that we received all required accounts
        let asset_info = try_get_account_info(ctx.accounts.remaining, index)?;
        let collection_info = try_get_account_info(ctx.accounts.remaining, index + 1)?;
        ctx.account_cursor += 2;

        verify_core_collection(asset_info, &collection_info.key())?;
        assert_keys_equal(&collection_info.key(), &self.required_collection)
            .map_err(|_| CandyGuardError::InvalidNftCollection)?;

        let asset = BaseAssetV1::try_from(asset_info)?;
        assert_keys_equal(&asset.owner, ctx.accounts.minter.key)
            .map_err(|_| CandyGuardError::IncorrectOwner)?;

        ctx.indices.insert("asset_burn_index", index);

        Ok(())
    }

    fn pre_actions<'info>(
        &self,
        ctx: &mut EvaluationContext,
        _guard_set: &GuardSet,
        _mint_args: &[u8],
    ) -> Result<()> {
        let index = ctx.indices["asset_burn_index"];
        let asset_info = try_get_account_info(ctx.accounts.remaining, index)?;
        let collection_info = try_get_account_info(ctx.accounts.remaining, index + 1)?;

        let mut burn_cpi = BurnV1CpiBuilder::new(&ctx.accounts.mpl_core_program);

        burn_cpi
            .asset(asset_info)
            .collection(Some(collection_info))
            .authority(Some(&ctx.accounts.minter))
            .payer(&ctx.accounts.minter);

        burn_cpi.invoke()?;

        Ok(())
    }
}
