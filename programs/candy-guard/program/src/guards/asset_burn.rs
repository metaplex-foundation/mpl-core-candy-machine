use super::*;

use mpl_core::{instructions::BurnV1CpiBuilder, types::UpdateAuthority, Asset};

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

        let asset = Asset::try_from(asset_info)?;
        let asset_collection = match asset.base.update_authority {
            UpdateAuthority::Collection(pubkey) => Some(pubkey),
            _ => None,
        };

        if asset_collection.is_none() {
            return err!(CandyGuardError::InvalidNftCollection);
        }

        assert_keys_equal(&asset_collection.unwrap(), &self.required_collection)?;
        assert_keys_equal(&collection_info.key(), &self.required_collection)?;

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
            .payer(&ctx.accounts.payer);

        burn_cpi.invoke()?;

        Ok(())
    }
}
