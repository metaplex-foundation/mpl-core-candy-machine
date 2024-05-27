//! This code was AUTOGENERATED using the kinobi library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun kinobi to update it.
//!
//! [https://github.com/metaplex-foundation/kinobi]
//!

use borsh::BorshDeserialize;
use borsh::BorshSerialize;
use solana_program::pubkey::Pubkey;

/// Guard that charges another NFT (token) from a specific collection as payment
/// for the mint.
///
/// List of accounts required:
///
/// 0. `[writeable]` Token account of the NFT.
/// 1. `[writeable]` Metadata account of the NFT.
/// 2. `[]` Mint account of the NFT.
/// 3. `[]` Account to receive the NFT.
/// 4. `[writeable]` Destination PDA key (seeds [destination pubkey, token program id, nft mint pubkey]).
/// 5. `[]` spl-associate-token program ID.
/// 6. `[]` SPL token program.
/// 7. `[]` Token Metadata program.
/// 8. `[]` Master edition (pNFT)
/// 9. `[writable]` Owner token record (pNFT)
/// 10. `[writable]` Destination token record (pNFT)
/// 11. `[]` Token Authorization Rules program (pNFT)
/// 12. `[]` Token Authorization Rules account (pNFT)
#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]
pub struct NftPayment {
    pub required_collection: Pubkey,
    pub destination: Pubkey,
}
