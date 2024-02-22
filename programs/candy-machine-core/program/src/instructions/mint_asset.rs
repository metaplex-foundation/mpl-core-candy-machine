use anchor_lang::prelude::*;
use arrayref::array_ref;
use mpl_asset::{self, instructions::CreateCpiBuilder};
use solana_program::sysvar;

use crate::{
    constants::{AUTHORITY_SEED, EMPTY_STR, HIDDEN_SECTION, NULL_STRING},
    utils::*,
    CandyError, CandyMachine, ConfigLine,
};

/// Accounts to mint an NFT.
pub(crate) struct MintAccounts<'info> {
    pub authority_pda: AccountInfo<'info>,
    pub payer: AccountInfo<'info>,
    pub asset_owner: AccountInfo<'info>,
    pub asset: AccountInfo<'info>,
    pub collection: AccountInfo<'info>,
    pub collection_update_authority: AccountInfo<'info>,
    pub asset_program: AccountInfo<'info>,
    pub system_program: AccountInfo<'info>,
    pub sysvar_instructions: Option<AccountInfo<'info>>,
    pub recent_slothashes: AccountInfo<'info>,
}

pub fn mint_asset<'info>(ctx: Context<'_, '_, '_, 'info, MintAsset<'info>>) -> Result<()> {
    let accounts = MintAccounts {
        authority_pda: ctx.accounts.authority_pda.to_account_info(),
        collection: ctx.accounts.collection.to_account_info(),
        asset_owner: ctx.accounts.asset_owner.to_account_info(),
        asset: ctx.accounts.asset.to_account_info(),
        collection_update_authority: ctx.accounts.collection_update_authority.to_account_info(),
        payer: ctx.accounts.payer.to_account_info(),
        recent_slothashes: ctx.accounts.recent_slothashes.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        asset_program: ctx.accounts.asset_program.to_account_info(),
        sysvar_instructions: Some(ctx.accounts.sysvar_instructions.to_account_info()),
    };

    process_mint_asset(
        &mut ctx.accounts.candy_machine,
        accounts,
        ctx.bumps["authority_pda"],
    )
}

/// Mint a new NFT.
///
/// The index minted depends on the configuration of the candy machine: it could be
/// a psuedo-randomly selected one or sequential. In both cases, after minted a
/// specific index, the candy machine does not allow to mint the same index again.
pub(crate) fn process_mint_asset(
    candy_machine: &mut Box<Account<'_, CandyMachine>>,
    accounts: MintAccounts,
    bump: u8,
) -> Result<()> {
    if !accounts.asset.data_is_empty() {
        return err!(CandyError::MetadataAccountMustBeEmpty);
    }

    // are there items to be minted?
    if candy_machine.items_redeemed >= candy_machine.data.items_available {
        return err!(CandyError::CandyMachineEmpty);
    }

    // check that we got the correct collection mint
    if !cmp_pubkeys(&accounts.collection.key(), &candy_machine.collection_mint) {
        return err!(CandyError::CollectionKeyMismatch);
    }

    // TODO check collection owner
    // collection metadata must be owner by token metadata
    // if !cmp_pubkeys(accounts.collection.owner, &mpl_asset::ID) {
    //     return err!(CandyError::IncorrectOwner);
    // }

    // TODO check collection stuff
    // let collection_metadata: Metadata =
    //     Metadata::try_from(&collection_metadata_info.to_account_info())?;
    // // check that the update authority matches the collection update authority
    // if !cmp_pubkeys(
    //     &collection_metadata.update_authority,
    //     &accounts.collection_update_authority.key(),
    // ) {
    //     return err!(CandyError::IncorrectCollectionAuthority);
    // }

    // (2) selecting an item to mint

    let recent_slothashes = &accounts.recent_slothashes;
    let data = recent_slothashes.data.borrow();
    let most_recent = array_ref![data, 12, 8];

    let clock = Clock::get()?;
    // seed for the random number is a combination of the slot_hash - timestamp
    let seed = u64::from_le_bytes(*most_recent).saturating_sub(clock.unix_timestamp as u64);

    let remainder: usize = seed
        .checked_rem(candy_machine.data.items_available - candy_machine.items_redeemed)
        .ok_or(CandyError::NumericalOverflowError)? as usize;

    let config_line = get_config_line(candy_machine, remainder, candy_machine.items_redeemed)?;

    candy_machine.items_redeemed = candy_machine
        .items_redeemed
        .checked_add(1)
        .ok_or(CandyError::NumericalOverflowError)?;
    // release the data borrow
    drop(data);

    // (3) minting

    let mut creators: Vec<mpl_token_metadata::types::Creator> =
        vec![mpl_token_metadata::types::Creator {
            address: accounts.authority_pda.key(),
            verified: true,
            share: 0,
        }];

    for c in &candy_machine.data.creators {
        creators.push(mpl_token_metadata::types::Creator {
            address: c.address,
            verified: false,
            share: c.percentage_share,
        });
    }

    create_and_mint(candy_machine, accounts, bump, config_line, creators)
}

/// Selects and returns the information of a config line.
///
/// The selection could be either sequential or random.
pub fn get_config_line(
    candy_machine: &Account<'_, CandyMachine>,
    index: usize,
    mint_number: u64,
) -> Result<ConfigLine> {
    if let Some(hs) = &candy_machine.data.hidden_settings {
        return Ok(ConfigLine {
            name: replace_patterns(hs.name.clone(), mint_number as usize),
            uri: replace_patterns(hs.uri.clone(), mint_number as usize),
        });
    }
    let settings = if let Some(settings) = &candy_machine.data.config_line_settings {
        settings
    } else {
        return err!(CandyError::MissingConfigLinesSettings);
    };

    let account_info = candy_machine.to_account_info();
    let mut account_data = account_info.data.borrow_mut();

    // validates that all config lines were added to the candy machine
    let config_count = get_config_count(&account_data)? as u64;
    if config_count != candy_machine.data.items_available {
        return err!(CandyError::NotFullyLoaded);
    }

    // (1) determine the mint index (index is a random index on the available indices array)

    let value_to_use = if settings.is_sequential {
        mint_number as usize
    } else {
        let items_available = candy_machine.data.items_available;
        let indices_start = HIDDEN_SECTION
            + 4
            + (items_available as usize) * candy_machine.data.get_config_line_size()
            + (items_available
                .checked_div(8)
                .ok_or(CandyError::NumericalOverflowError)?
                + 1) as usize;
        // calculates the mint index and retrieves the value at that position
        let mint_index = indices_start + index * 4;
        let value_to_use = u32::from_le_bytes(*array_ref![account_data, mint_index, 4]) as usize;
        // calculates the last available index and retrieves the value at that position
        let last_index = indices_start + ((items_available - mint_number - 1) * 4) as usize;
        let last_value = u32::from_le_bytes(*array_ref![account_data, last_index, 4]);
        // swap-remove: this guarantees that we remove the used mint index from the available array
        // in a constant time O(1) no matter how big the indices array is
        account_data[mint_index..mint_index + 4].copy_from_slice(&u32::to_le_bytes(last_value));

        value_to_use
    };

    // (2) retrieve the config line at the mint_index position

    let mut position =
        HIDDEN_SECTION + 4 + value_to_use * candy_machine.data.get_config_line_size();
    let name_length = settings.name_length as usize;
    let uri_length = settings.uri_length as usize;

    let name = if name_length > 0 {
        let name_slice: &mut [u8] = &mut account_data[position..position + name_length];
        let name = String::from_utf8(name_slice.to_vec())
            .map_err(|_| CandyError::CouldNotRetrieveConfigLineData)?;
        name.trim_end_matches(NULL_STRING).to_string()
    } else {
        EMPTY_STR.to_string()
    };

    position += name_length;
    let uri = if uri_length > 0 {
        let uri_slice: &mut [u8] = &mut account_data[position..position + uri_length];
        let uri = String::from_utf8(uri_slice.to_vec())
            .map_err(|_| CandyError::CouldNotRetrieveConfigLineData)?;
        uri.trim_end_matches(NULL_STRING).to_string()
    } else {
        EMPTY_STR.to_string()
    };

    let complete_name = replace_patterns(settings.prefix_name.clone(), value_to_use) + &name;
    let complete_uri = replace_patterns(settings.prefix_uri.clone(), value_to_use) + &uri;

    Ok(ConfigLine {
        name: complete_name,
        uri: complete_uri,
    })
}

/// Creates the metadata accounts and mint a new token.
fn create_and_mint(
    candy_machine: &mut Box<Account<'_, CandyMachine>>,
    accounts: MintAccounts,
    bump: u8,
    config_line: ConfigLine,
    creators: Vec<mpl_token_metadata::types::Creator>,
    // collection_metadata: Metadata,
) -> Result<()> {
    let candy_machine_key = candy_machine.key();
    let authority_seeds = [
        AUTHORITY_SEED.as_bytes(),
        candy_machine_key.as_ref(),
        &[bump],
    ];

    let sysvar_instructions_info = accounts
        .sysvar_instructions
        .as_ref()
        .ok_or(CandyError::MissingInstructionsSysvar)?;

    CreateCpiBuilder::new(&accounts.asset_program)
        .payer(&accounts.payer)
        .asset_address(&accounts.asset)
        .owner(Some(&accounts.asset_owner))
        .name(config_line.name)
        .uri(config_line.uri)
        .data_state(mpl_asset::types::DataState::AccountState)
        .update_authority(Some(&accounts.collection_update_authority))
        .system_program(&accounts.system_program)
        .invoke_signed(&[&authority_seeds])
        .map_err(|error| error.into())
}

/// Mints a new Asset.
#[derive(Accounts)]
pub struct MintAsset<'info> {
    /// Candy machine account.
    #[account(mut, has_one = mint_authority)]
    candy_machine: Box<Account<'info, CandyMachine>>,

    /// Candy machine authority account. This is the account that holds a delegate
    /// to verify an item into the collection.
    ///
    /// CHECK: account constraints checked in account trait
    #[account(mut, seeds = [AUTHORITY_SEED.as_bytes(), candy_machine.key().as_ref()], bump)]
    authority_pda: UncheckedAccount<'info>,

    /// Candy machine mint authority (mint only allowed for the mint_authority).
    mint_authority: Signer<'info>,

    /// Payer for the transaction and account allocation (rent).
    #[account(mut)]
    payer: Signer<'info>,

    /// NFT account owner.
    ///
    /// CHECK: account not written or read from
    asset_owner: UncheckedAccount<'info>,

    /// Mint account of the NFT. The account will be initialized if necessary.
    ///
    /// CHECK: account checked in CPI
    #[account(mut)]
    asset: Signer<'info>,

    /// Mint account of the collection NFT.
    ///
    /// CHECK: account checked in CPI
    #[account(mut)]
    collection: UncheckedAccount<'info>,

    /// Update authority of the collection NFT.
    ///
    /// CHECK: account checked in CPI
    collection_update_authority: UncheckedAccount<'info>,

    /// Token Metadata program.
    ///
    /// CHECK: account checked in CPI
    #[account(address = mpl_asset::ID)]
    asset_program: UncheckedAccount<'info>,

    /// System program.
    system_program: Program<'info, System>,

    /// Instructions sysvar account.
    ///
    /// CHECK: account constraints checked in account trait
    #[account(address = sysvar::instructions::id())]
    sysvar_instructions: UncheckedAccount<'info>,

    /// SlotHashes sysvar cluster data.
    ///
    /// CHECK: account constraints checked in account trait
    #[account(address = sysvar::slot_hashes::id())]
    recent_slothashes: UncheckedAccount<'info>,
}
