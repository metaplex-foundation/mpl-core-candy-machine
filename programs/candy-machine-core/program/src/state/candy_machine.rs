use anchor_lang::prelude::*;
use anchor_lang::prelude::borsh::{BorshDeserialize, BorshSerialize};
use mpl_core::types::PluginAuthorityPair;

use super::candy_machine_data::CandyMachineData;

/// Candy machine state and config data.
#[account]
#[derive(Default, Debug)]
pub struct CandyMachine {
    /// Authority address.
    pub authority: Pubkey,
    /// Authority address allowed to mint from the candy machine.
    pub mint_authority: Pubkey,
    /// The collection mint for the candy machine.
    pub collection_mint: Pubkey,
    /// Number of assets redeemed.
    pub items_redeemed: u64,
    /// Candy machine configuration data.
    pub data: CandyMachineData,
    // hidden data section to avoid deserialisation:
    //
    // - (u32) how many actual lines of data there are currently (eventually
    //   equals items available)
    // - (ConfigLine * items_available) lines and lines of name + uri data
    // - (item_available / 8) + 1 bit mask to keep track of which ConfigLines
    //   have been added
    // - (u32 * items_available) mint indices
}

/// Config line struct for storing asset (NFT) data pre-mint.
#[derive(AnchorSerialize, AnchorDeserialize, Debug)]
pub struct ConfigLine {
    /// Name of the asset.
    pub name: String,
    /// URI to JSON metadata.
    pub uri: String,
}

#[derive(BorshSerialize, BorshDeserialize, Eq, PartialEq, Clone, Debug)]
pub struct MintAssetArgs {
    pub plugins: Vec<PluginAuthorityPair>,
}

#[cfg(feature = "idl-build")]
impl IdlBuild for MintAssetArgs {
    fn create_type() -> Option<anchor_lang::idl::types::IdlTypeDef> {
        use anchor_lang::idl::types::{
            IdlDefinedFields, IdlField, IdlSerialization, IdlType, IdlTypeDef, IdlTypeDefTy,
        };

        Some(IdlTypeDef {
            name: "MintAssetArgs".into(),
            docs: Vec::new(),
            serialization: IdlSerialization::Borsh,
            repr: None,
            generics: Vec::new(),
            ty: IdlTypeDefTy::Struct {
                fields: Some(IdlDefinedFields::Named(vec![IdlField {
                    name: "plugins".into(),
                    docs: Vec::new(),
                    ty: IdlType::Vec(Box::new(IdlType::Defined {
                        name: "PluginAuthorityPair".into(),
                        generics: Vec::new(),
                    })),
                }])),
            },
        })
    }
}
