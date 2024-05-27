//! This code was AUTOGENERATED using the kinobi library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun kinobi to update it.
//!
//! [https://github.com/metaplex-foundation/kinobi]
//!

use num_derive::FromPrimitive;
use thiserror::Error;

#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum MplCoreCandyGuardError {
    /// 0x1770 - Could not save guard to account
    #[error("Could not save guard to account")]
    InvalidAccountSize,
    /// 0x1771 - Could not deserialize guard
    #[error("Could not deserialize guard")]
    DeserializationError,
    /// 0x1772 - Public key mismatch
    #[error("Public key mismatch")]
    PublicKeyMismatch,
    /// 0x1773 - Exceeded account increase limit
    #[error("Exceeded account increase limit")]
    DataIncrementLimitExceeded,
    /// 0x1774 - Account does not have correct owner
    #[error("Account does not have correct owner")]
    IncorrectOwner,
    /// 0x1775 - Account is not initialized
    #[error("Account is not initialized")]
    Uninitialized,
    /// 0x1776 - Missing expected remaining account
    #[error("Missing expected remaining account")]
    MissingRemainingAccount,
    /// 0x1777 - Numerical overflow error
    #[error("Numerical overflow error")]
    NumericalOverflowError,
    /// 0x1778 - Missing required group label
    #[error("Missing required group label")]
    RequiredGroupLabelNotFound,
    /// 0x1779 - Group not found
    #[error("Group not found")]
    GroupNotFound,
    /// 0x177A - Value exceeded maximum length
    #[error("Value exceeded maximum length")]
    ExceededLength,
    /// 0x177B - Candy machine is empty
    #[error("Candy machine is empty")]
    CandyMachineEmpty,
    /// 0x177C - No instruction was found
    #[error("No instruction was found")]
    InstructionNotFound,
    /// 0x177D - Collection public key mismatch
    #[error("Collection public key mismatch")]
    CollectionKeyMismatch,
    /// 0x177E - Missing collection accounts
    #[error("Missing collection accounts")]
    MissingCollectionAccounts,
    /// 0x177F - Collection update authority public key mismatch
    #[error("Collection update authority public key mismatch")]
    CollectionUpdateAuthorityKeyMismatch,
    /// 0x1780 - Mint must be the last instructions of the transaction
    #[error("Mint must be the last instructions of the transaction")]
    MintNotLastTransaction,
    /// 0x1781 - Mint is not live
    #[error("Mint is not live")]
    MintNotLive,
    /// 0x1782 - Not enough SOL to pay for the mint
    #[error("Not enough SOL to pay for the mint")]
    NotEnoughSOL,
    /// 0x1783 - Token burn failed
    #[error("Token burn failed")]
    TokenBurnFailed,
    /// 0x1784 - Not enough tokens on the account
    #[error("Not enough tokens on the account")]
    NotEnoughTokens,
    /// 0x1785 - Token transfer failed
    #[error("Token transfer failed")]
    TokenTransferFailed,
    /// 0x1786 - A signature was required but not found
    #[error("A signature was required but not found")]
    MissingRequiredSignature,
    /// 0x1787 - Gateway token is not valid
    #[error("Gateway token is not valid")]
    GatewayTokenInvalid,
    /// 0x1788 - Current time is after the set end date
    #[error("Current time is after the set end date")]
    AfterEndDate,
    /// 0x1789 - Current time is not within the allowed mint time
    #[error("Current time is not within the allowed mint time")]
    InvalidMintTime,
    /// 0x178A - Address not found on the allowed list
    #[error("Address not found on the allowed list")]
    AddressNotFoundInAllowedList,
    /// 0x178B - Missing allowed list proof
    #[error("Missing allowed list proof")]
    MissingAllowedListProof,
    /// 0x178C - Allow list guard is not enabled
    #[error("Allow list guard is not enabled")]
    AllowedListNotEnabled,
    /// 0x178D - The maximum number of allowed mints was reached
    #[error("The maximum number of allowed mints was reached")]
    AllowedMintLimitReached,
    /// 0x178E - Invalid NFT collection
    #[error("Invalid NFT collection")]
    InvalidNftCollection,
    /// 0x178F - Missing NFT on the account
    #[error("Missing NFT on the account")]
    MissingNft,
    /// 0x1790 - Current redemeed items is at the set maximum amount
    #[error("Current redemeed items is at the set maximum amount")]
    MaximumRedeemedAmount,
    /// 0x1791 - Address not authorized
    #[error("Address not authorized")]
    AddressNotAuthorized,
    /// 0x1792 - Missing freeze instruction data
    #[error("Missing freeze instruction data")]
    MissingFreezeInstruction,
    /// 0x1793 - Freeze guard must be enabled
    #[error("Freeze guard must be enabled")]
    FreezeGuardNotEnabled,
    /// 0x1794 - Freeze must be initialized
    #[error("Freeze must be initialized")]
    FreezeNotInitialized,
    /// 0x1795 - Missing freeze period
    #[error("Missing freeze period")]
    MissingFreezePeriod,
    /// 0x1796 - The freeze escrow account already exists
    #[error("The freeze escrow account already exists")]
    FreezeEscrowAlreadyExists,
    /// 0x1797 - Maximum freeze period exceeded
    #[error("Maximum freeze period exceeded")]
    ExceededMaximumFreezePeriod,
    /// 0x1798 - Thaw is not enabled
    #[error("Thaw is not enabled")]
    ThawNotEnabled,
    /// 0x1799 - Unlock is not enabled (not all NFTs are thawed)
    #[error("Unlock is not enabled (not all NFTs are thawed)")]
    UnlockNotEnabled,
    /// 0x179A - Duplicated group label
    #[error("Duplicated group label")]
    DuplicatedGroupLabel,
    /// 0x179B - Duplicated mint limit id
    #[error("Duplicated mint limit id")]
    DuplicatedMintLimitId,
    /// 0x179C - An unauthorized program was found in the transaction
    #[error("An unauthorized program was found in the transaction")]
    UnauthorizedProgramFound,
    /// 0x179D - Exceeded the maximum number of programs in the additional list
    #[error("Exceeded the maximum number of programs in the additional list")]
    ExceededProgramListSize,
    /// 0x179E - Allocation PDA not initialized
    #[error("Allocation PDA not initialized")]
    AllocationNotInitialized,
    /// 0x179F - Allocation limit was reached
    #[error("Allocation limit was reached")]
    AllocationLimitReached,
    /// 0x17A0 - Allocation guard must be enabled
    #[error("Allocation guard must be enabled")]
    AllocationGuardNotEnabled,
    /// 0x17A1 - Candy machine has an invalid mint authority
    #[error("Candy machine has an invalid mint authority")]
    InvalidMintAuthority,
    /// 0x17A2 - Instruction could not be created
    #[error("Instruction could not be created")]
    InstructionBuilderFailed,
    /// 0x17A3 - Invalid account version
    #[error("Invalid account version")]
    InvalidAccountVersion,
}

impl solana_program::program_error::PrintProgramError for MplCoreCandyGuardError {
    fn print<E>(&self) {
        solana_program::msg!(&self.to_string());
    }
}
