use super::*;

use mpl_core::types::Plugin;

use crate::{errors::CandyGuardError, state::GuardType};

/// Guard that adds an edition plugin to the asset.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Edition {
    pub edition_start_offset: u32,
}

impl Guard for Edition {
    fn size() -> usize {
        4 // edition_start_offset
    }

    fn mask() -> u64 {
        GuardType::as_mask(GuardType::Edition)
    }
}

impl Condition for Edition {
    fn validate<'info>(
        &self,
        _ctx: &mut EvaluationContext,
        _guard_set: &GuardSet,
        _mint_args: &[u8],
    ) -> Result<()> {
        Ok(())
    }

    fn pre_actions<'info>(
        &self,
        ctx: &mut EvaluationContext,
        _guard_set: &GuardSet,
        _mint_args: &[u8],
    ) -> Result<()> {
        let current: u32 = ctx
            .accounts
            .candy_machine
            .items_redeemed
            .try_into()
            .map_err(|_| CandyGuardError::NumericalOverflowError)?;

        ctx.plugins.push(PluginAuthorityPair {
            plugin: Plugin::Edition(mpl_core::types::Edition {
                number: current
                    .checked_add(1)
                    .ok_or(CandyGuardError::NumericalOverflowError)
                    .unwrap()
                    .checked_add(self.edition_start_offset)
                    .ok_or(CandyGuardError::NumericalOverflowError)?,
            }),
            authority: None,
        });

        Ok(())
    }
}
