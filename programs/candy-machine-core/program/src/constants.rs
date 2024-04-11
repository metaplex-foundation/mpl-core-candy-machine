pub use mpl_token_metadata::{
    MAX_CREATOR_LEN, MAX_CREATOR_LIMIT, MAX_NAME_LENGTH, MAX_SYMBOL_LENGTH, MAX_URI_LENGTH,
};
use solana_program::{pubkey, pubkey::Pubkey};

pub const MPL_TOKEN_AUTH_RULES_PROGRAM: Pubkey =
    pubkey!("auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg");

// Empty value used for string padding.
pub const NULL_STRING: &str = "\0";

// Constant to define the replacement index string.
pub const REPLACEMENT_INDEX: &str = "$ID$";

// Constant to define the replacement index increment string.
pub const REPLACEMENT_INDEX_INCREMENT: &str = "$ID+1$";

// Empty string constant.
pub const EMPTY_STR: &str = "";

// Seed used to derive the authority PDA address.
pub const AUTHORITY_SEED: &str = "candy_machine";

// Determine the start of the account hidden section.
pub const HIDDEN_SECTION: usize = 8           // discriminator
    + 32                                      // authority
    + 32                                      // mint authority
    + 32                                      // collection mint
    + 8                                       // items redeemed
    + 8                                       // items available (config data)
    + 8                                       // max supply
    + 1                                       // is mutable
    + 1                                       // option (config lines settings)
    + 4 + MAX_NAME_LENGTH                     // u32 + max name length
    + 4                                       // name length
    + 4 + MAX_URI_LENGTH                      // u32 + max uri length
    + 4                                       // uri length
    + 1                                       // is sequential
    + 1                                       // option (hidden setting)
    + 4 + MAX_NAME_LENGTH                     // u32 + max name length
    + 4 + MAX_URI_LENGTH                      // u32 + max uri length
    + 32; // hash

pub const SET: u8 = 1;

pub const UNSET: u8 = 0;
