use anchor_lang::prelude::*;
pub use initialize::*;
pub use mint_v1::*;
use mpl_core_candy_machine_core::CandyMachine;
pub use route::*;
pub use set_authority::*;
pub use unwrap::*;
pub use update::*;
pub use withdraw::*;
pub use wrap::*;

use crate::state::CandyGuard;

pub mod initialize;
pub mod mint_v1;
pub mod route;
pub mod set_authority;
pub mod unwrap;
pub mod update;
pub mod withdraw;
pub mod wrap;

/// Accounts to mint an NFT.
pub(crate) struct MintAccounts<'b, 'c, 'info> {
    pub(crate) candy_guard: &'b Account<'info, CandyGuard>,
    pub(crate) candy_machine: &'b Account<'info, CandyMachine>,
    pub(crate) candy_machine_authority_pda: AccountInfo<'info>,
    pub(crate) payer: AccountInfo<'info>,
    pub(crate) minter: AccountInfo<'info>,
    pub(crate) owner: AccountInfo<'info>,
    pub(crate) asset: AccountInfo<'info>,
    pub(crate) collection: AccountInfo<'info>,
    pub(crate) _candy_machine_program: AccountInfo<'info>,
    pub(crate) mpl_core_program: AccountInfo<'info>,
    pub(crate) system_program: AccountInfo<'info>,
    pub(crate) sysvar_instructions: AccountInfo<'info>,
    pub(crate) recent_slothashes: AccountInfo<'info>,
    pub(crate) remaining: &'c [AccountInfo<'info>],
}

#[derive(Debug, Clone)]
pub struct Token;

impl anchor_lang::Id for Token {
    fn id() -> Pubkey {
        spl_token::ID
    }
}

#[derive(Debug, Clone)]
pub struct AssociatedToken;

impl anchor_lang::Id for AssociatedToken {
    fn id() -> Pubkey {
        spl_associated_token_account::ID
    }
}
