use regex_lite::Regex;

use crate::state::GuardType;

use super::*;

const MAXIMUM_LENGTH: usize = 100;

/// Guard that sets a specific start date for the mint.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct VanityMint {
    pub regex: String,
}

impl Guard for VanityMint {
    fn size() -> usize {
        4 + // String prefix
        100 // MAXIMUM_LENGTH
    }

    fn mask() -> u64 {
        GuardType::as_mask(GuardType::VanityMint)
    }

    fn verify(data: &CandyGuardData) -> Result<()> {
        if let Some(vanity_mint) = &data.default.vanity_mint {
            if vanity_mint.regex.len() > MAXIMUM_LENGTH {
                return err!(CandyGuardError::ExceededRegexLength);
            }
        }

        if let Some(groups) = &data.groups {
            for group in groups {
                if let Some(vanity_mint) = &group.guards.vanity_mint {
                    if vanity_mint.regex.len() > MAXIMUM_LENGTH {
                        return err!(CandyGuardError::ExceededRegexLength);
                    }
                }
            }
        }

        Ok(())
    }
}

impl Condition for VanityMint {
    fn validate<'info>(
        &self,
        ctx: &mut EvaluationContext,
        _guard_set: &GuardSet,
        _mint_args: &[u8],
    ) -> Result<()> {
        let mint_address = ctx.accounts.asset.key().to_string();
        let regex = Regex::new(&self.regex).map_err(|_| CandyGuardError::InvalidRegex)?;
        if !regex.is_match(&mint_address) {
            return err!(CandyGuardError::InvalidVanityAddress);
        }

        Ok(())
    }
}
