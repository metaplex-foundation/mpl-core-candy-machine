use mpl_core::accounts::BaseAssetV1;

use super::*;
use crate::{errors::CandyGuardError, state::GuardType, utils::assert_keys_equal};

/// Guard that restricts the transaction to holders of a specified collection.
///
/// List of accounts required:
///
///   0. `[]` Account of the Asset.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct AssetGate {
    pub required_collection: Pubkey,
}

impl Guard for AssetGate {
    fn size() -> usize {
        32 // required_collection
    }

    fn mask() -> u64 {
        GuardType::as_mask(GuardType::AssetGate)
    }
}

impl Condition for AssetGate {
    fn validate<'info>(
        &self,
        ctx: &mut EvaluationContext,
        _guard_set: &GuardSet,
        _mint_args: &[u8],
    ) -> Result<()> {
        let index = ctx.account_cursor;
        // validates that we received all required accounts
        let asset_account = try_get_account_info(ctx.accounts.remaining, index)?;
        ctx.account_cursor += 1;

        Self::verify_collection(
            asset_account,
            &self.required_collection,
            ctx.accounts.minter.key,
        )
    }
}

impl AssetGate {
    pub fn verify_collection(
        asset_account: &AccountInfo,
        collection: &Pubkey,
        owner: &Pubkey,
    ) -> Result<()> {
        // validates the metadata information
        assert_keys_equal(asset_account.owner, &mpl_core::ID)?;

        let asset: BaseAssetV1 = BaseAssetV1::try_from(asset_account)?;
        if asset.update_authority != UpdateAuthority::Collection(*collection) {
            return Err(CandyGuardError::InvalidNftCollection.into());
        }

        if asset.owner != *owner {
            return Err(CandyGuardError::MissingNft.into());
        }

        Ok(())
    }
}
