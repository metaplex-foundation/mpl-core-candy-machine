#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

use instructions::*;

pub mod errors;
pub mod guards;
pub mod instructions;
pub mod state;
pub mod utils;

declare_id!("CMAGAKJ67e9hRZgfC5SFTbZH8MgEmtqazKXjmkaJjWTJ");

// START: Heap start
// LENGTH: Heap length
// MIN: Minimal allocation size
// PAGE_SIZE: Allocation page size
#[cfg(target_os = "solana")]
#[global_allocator]
static ALLOC: smalloc::Smalloc<
    { solana_program::entrypoint::HEAP_START_ADDRESS as usize },
    { solana_program::entrypoint::HEAP_LENGTH as usize },
    16,
    1024,
> = smalloc::Smalloc::new();

#[program]
pub mod candy_guard {
    use super::*;

    /// Create a new candy guard account.
    pub fn initialize(ctx: Context<Initialize>, data: Vec<u8>) -> Result<()> {
        instructions::initialize(ctx, data)
    }

    /// Mint an NFT from a candy machine wrapped in the candy guard.
    pub fn mint_v1<'info>(
        ctx: Context<'_, '_, '_, 'info, MintV1<'info>>,
        mint_args: Vec<u8>,
        label: Option<String>,
    ) -> Result<()> {
        instructions::mint_v1(ctx, mint_args, label)
    }

    /// Route the transaction to a guard instruction.
    pub fn route<'info>(
        ctx: Context<'_, '_, '_, 'info, Route<'info>>,
        args: RouteArgs,
        label: Option<String>,
    ) -> Result<()> {
        instructions::route(ctx, args, label)
    }

    /// Set a new authority of the candy guard.
    pub fn set_authority(ctx: Context<SetAuthority>, new_authority: Pubkey) -> Result<()> {
        instructions::set_authority(ctx, new_authority)
    }

    /// Remove a candy guard from a candy machine, setting the authority to the
    /// candy guard authority.
    pub fn unwrap(ctx: Context<Unwrap>) -> Result<()> {
        instructions::unwrap(ctx)
    }

    /// Update the candy guard configuration.
    pub fn update(ctx: Context<Update>, data: Vec<u8>) -> Result<()> {
        instructions::update(ctx, data)
    }

    /// Withdraw the rent SOL from the candy guard account.
    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        instructions::withdraw(ctx)
    }

    /// Add a candy guard to a candy machine. After the guard is added, mint
    /// is only allowed through the candy guard.
    pub fn wrap(ctx: Context<Wrap>) -> Result<()> {
        instructions::wrap(ctx)
    }
}
