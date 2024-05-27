//! This code was AUTOGENERATED using the kinobi library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun kinobi to update it.
//!
//! [https://github.com/metaplex-foundation/kinobi]
//!

use borsh::BorshDeserialize;
use borsh::BorshSerialize;

/// Accounts.
pub struct SetCollection {
    /// Candy Machine account.
    pub candy_machine: solana_program::pubkey::Pubkey,
    /// Candy Machine authority.
    pub authority: solana_program::pubkey::Pubkey,
    /// Authority PDA.
    ///
    pub authority_pda: solana_program::pubkey::Pubkey,
    /// Payer of the transaction.
    pub payer: solana_program::pubkey::Pubkey,
    /// Update authority of the collection.
    ///
    pub collection_update_authority: solana_program::pubkey::Pubkey,
    /// Mint account of the collection.
    ///
    pub collection: solana_program::pubkey::Pubkey,
    /// Update authority of the new collection NFT.
    pub new_collection_update_authority: solana_program::pubkey::Pubkey,
    /// New collection mint.
    ///
    pub new_collection: solana_program::pubkey::Pubkey,
    /// Token Metadata program.
    ///
    pub mpl_core_program: solana_program::pubkey::Pubkey,
    /// System program.
    pub system_program: solana_program::pubkey::Pubkey,
    /// Instructions sysvar account.
    ///
    pub sysvar_instructions: solana_program::pubkey::Pubkey,
}

impl SetCollection {
    #[allow(clippy::vec_init_then_push)]
    pub fn instruction(&self) -> solana_program::instruction::Instruction {
        let mut accounts = Vec::with_capacity(11);
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.candy_machine,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.authority,
            true,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.authority_pda,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.payer, true,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.collection_update_authority,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.collection,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.new_collection_update_authority,
            true,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.new_collection,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.mpl_core_program,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.system_program,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.sysvar_instructions,
            false,
        ));
        let data = SetCollectionInstructionData::new().try_to_vec().unwrap();

        solana_program::instruction::Instruction {
            program_id: crate::MPL_CORE_CANDY_MACHINE_CORE_ID,
            accounts,
            data,
        }
    }
}

#[derive(BorshDeserialize, BorshSerialize)]
struct SetCollectionInstructionData {
    discriminator: [u8; 8],
}

impl SetCollectionInstructionData {
    fn new() -> Self {
        Self {
            discriminator: [192, 254, 206, 76, 168, 182, 59, 223],
        }
    }
}

/// Instruction builder.
#[derive(Default)]
pub struct SetCollectionBuilder {
    candy_machine: Option<solana_program::pubkey::Pubkey>,
    authority: Option<solana_program::pubkey::Pubkey>,
    authority_pda: Option<solana_program::pubkey::Pubkey>,
    payer: Option<solana_program::pubkey::Pubkey>,
    collection_update_authority: Option<solana_program::pubkey::Pubkey>,
    collection: Option<solana_program::pubkey::Pubkey>,
    new_collection_update_authority: Option<solana_program::pubkey::Pubkey>,
    new_collection: Option<solana_program::pubkey::Pubkey>,
    mpl_core_program: Option<solana_program::pubkey::Pubkey>,
    system_program: Option<solana_program::pubkey::Pubkey>,
    sysvar_instructions: Option<solana_program::pubkey::Pubkey>,
}

impl SetCollectionBuilder {
    pub fn new() -> Self {
        Self::default()
    }
    /// Candy Machine account.
    #[inline(always)]
    pub fn candy_machine(&mut self, candy_machine: solana_program::pubkey::Pubkey) -> &mut Self {
        self.candy_machine = Some(candy_machine);
        self
    }
    /// Candy Machine authority.
    #[inline(always)]
    pub fn authority(&mut self, authority: solana_program::pubkey::Pubkey) -> &mut Self {
        self.authority = Some(authority);
        self
    }
    /// Authority PDA.
    ///
    #[inline(always)]
    pub fn authority_pda(&mut self, authority_pda: solana_program::pubkey::Pubkey) -> &mut Self {
        self.authority_pda = Some(authority_pda);
        self
    }
    /// Payer of the transaction.
    #[inline(always)]
    pub fn payer(&mut self, payer: solana_program::pubkey::Pubkey) -> &mut Self {
        self.payer = Some(payer);
        self
    }
    /// Update authority of the collection.
    ///
    #[inline(always)]
    pub fn collection_update_authority(
        &mut self,
        collection_update_authority: solana_program::pubkey::Pubkey,
    ) -> &mut Self {
        self.collection_update_authority = Some(collection_update_authority);
        self
    }
    /// Mint account of the collection.
    ///
    #[inline(always)]
    pub fn collection(&mut self, collection: solana_program::pubkey::Pubkey) -> &mut Self {
        self.collection = Some(collection);
        self
    }
    /// Update authority of the new collection NFT.
    #[inline(always)]
    pub fn new_collection_update_authority(
        &mut self,
        new_collection_update_authority: solana_program::pubkey::Pubkey,
    ) -> &mut Self {
        self.new_collection_update_authority = Some(new_collection_update_authority);
        self
    }
    /// New collection mint.
    ///
    #[inline(always)]
    pub fn new_collection(&mut self, new_collection: solana_program::pubkey::Pubkey) -> &mut Self {
        self.new_collection = Some(new_collection);
        self
    }
    /// Token Metadata program.
    ///
    #[inline(always)]
    pub fn mpl_core_program(
        &mut self,
        mpl_core_program: solana_program::pubkey::Pubkey,
    ) -> &mut Self {
        self.mpl_core_program = Some(mpl_core_program);
        self
    }
    /// System program.
    #[inline(always)]
    pub fn system_program(&mut self, system_program: solana_program::pubkey::Pubkey) -> &mut Self {
        self.system_program = Some(system_program);
        self
    }
    /// Instructions sysvar account.
    ///
    #[inline(always)]
    pub fn sysvar_instructions(
        &mut self,
        sysvar_instructions: solana_program::pubkey::Pubkey,
    ) -> &mut Self {
        self.sysvar_instructions = Some(sysvar_instructions);
        self
    }
    #[allow(clippy::clone_on_copy)]
    pub fn build(&self) -> solana_program::instruction::Instruction {
        let accounts = SetCollection {
            candy_machine: self.candy_machine.expect("candy_machine is not set"),
            authority: self.authority.expect("authority is not set"),
            authority_pda: self.authority_pda.expect("authority_pda is not set"),
            payer: self.payer.expect("payer is not set"),
            collection_update_authority: self
                .collection_update_authority
                .expect("collection_update_authority is not set"),
            collection: self.collection.expect("collection is not set"),
            new_collection_update_authority: self
                .new_collection_update_authority
                .expect("new_collection_update_authority is not set"),
            new_collection: self.new_collection.expect("new_collection is not set"),
            mpl_core_program: self.mpl_core_program.unwrap_or(solana_program::pubkey!(
                "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
            )),
            system_program: self
                .system_program
                .unwrap_or(solana_program::pubkey!("11111111111111111111111111111111")),
            sysvar_instructions: self.sysvar_instructions.unwrap_or(solana_program::pubkey!(
                "Sysvar1nstructions1111111111111111111111111"
            )),
        };

        accounts.instruction()
    }
}

/// `set_collection` CPI instruction.
pub struct SetCollectionCpi<'a> {
    /// The program to invoke.
    pub __program: &'a solana_program::account_info::AccountInfo<'a>,
    /// Candy Machine account.
    pub candy_machine: &'a solana_program::account_info::AccountInfo<'a>,
    /// Candy Machine authority.
    pub authority: &'a solana_program::account_info::AccountInfo<'a>,
    /// Authority PDA.
    ///
    pub authority_pda: &'a solana_program::account_info::AccountInfo<'a>,
    /// Payer of the transaction.
    pub payer: &'a solana_program::account_info::AccountInfo<'a>,
    /// Update authority of the collection.
    ///
    pub collection_update_authority: &'a solana_program::account_info::AccountInfo<'a>,
    /// Mint account of the collection.
    ///
    pub collection: &'a solana_program::account_info::AccountInfo<'a>,
    /// Update authority of the new collection NFT.
    pub new_collection_update_authority: &'a solana_program::account_info::AccountInfo<'a>,
    /// New collection mint.
    ///
    pub new_collection: &'a solana_program::account_info::AccountInfo<'a>,
    /// Token Metadata program.
    ///
    pub mpl_core_program: &'a solana_program::account_info::AccountInfo<'a>,
    /// System program.
    pub system_program: &'a solana_program::account_info::AccountInfo<'a>,
    /// Instructions sysvar account.
    ///
    pub sysvar_instructions: &'a solana_program::account_info::AccountInfo<'a>,
}

impl<'a> SetCollectionCpi<'a> {
    pub fn invoke(&self) -> solana_program::entrypoint::ProgramResult {
        self.invoke_signed(&[])
    }
    #[allow(clippy::clone_on_copy)]
    #[allow(clippy::vec_init_then_push)]
    pub fn invoke_signed(
        &self,
        signers_seeds: &[&[&[u8]]],
    ) -> solana_program::entrypoint::ProgramResult {
        let mut accounts = Vec::with_capacity(11);
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.candy_machine.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.authority.key,
            true,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.authority_pda.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.payer.key,
            true,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.collection_update_authority.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.collection.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.new_collection_update_authority.key,
            true,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.new_collection.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.mpl_core_program.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.system_program.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.sysvar_instructions.key,
            false,
        ));
        let data = SetCollectionInstructionData::new().try_to_vec().unwrap();

        let instruction = solana_program::instruction::Instruction {
            program_id: crate::MPL_CORE_CANDY_MACHINE_CORE_ID,
            accounts,
            data,
        };
        let mut account_infos = Vec::with_capacity(11 + 1);
        account_infos.push(self.__program.clone());
        account_infos.push(self.candy_machine.clone());
        account_infos.push(self.authority.clone());
        account_infos.push(self.authority_pda.clone());
        account_infos.push(self.payer.clone());
        account_infos.push(self.collection_update_authority.clone());
        account_infos.push(self.collection.clone());
        account_infos.push(self.new_collection_update_authority.clone());
        account_infos.push(self.new_collection.clone());
        account_infos.push(self.mpl_core_program.clone());
        account_infos.push(self.system_program.clone());
        account_infos.push(self.sysvar_instructions.clone());

        if signers_seeds.is_empty() {
            solana_program::program::invoke(&instruction, &account_infos)
        } else {
            solana_program::program::invoke_signed(&instruction, &account_infos, signers_seeds)
        }
    }
}

/// `set_collection` CPI instruction builder.
pub struct SetCollectionCpiBuilder<'a> {
    instruction: Box<SetCollectionCpiBuilderInstruction<'a>>,
}

impl<'a> SetCollectionCpiBuilder<'a> {
    pub fn new(program: &'a solana_program::account_info::AccountInfo<'a>) -> Self {
        let instruction = Box::new(SetCollectionCpiBuilderInstruction {
            __program: program,
            candy_machine: None,
            authority: None,
            authority_pda: None,
            payer: None,
            collection_update_authority: None,
            collection: None,
            new_collection_update_authority: None,
            new_collection: None,
            mpl_core_program: None,
            system_program: None,
            sysvar_instructions: None,
        });
        Self { instruction }
    }
    /// Candy Machine account.
    #[inline(always)]
    pub fn candy_machine(
        &mut self,
        candy_machine: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.candy_machine = Some(candy_machine);
        self
    }
    /// Candy Machine authority.
    #[inline(always)]
    pub fn authority(
        &mut self,
        authority: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.authority = Some(authority);
        self
    }
    /// Authority PDA.
    ///
    #[inline(always)]
    pub fn authority_pda(
        &mut self,
        authority_pda: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.authority_pda = Some(authority_pda);
        self
    }
    /// Payer of the transaction.
    #[inline(always)]
    pub fn payer(&mut self, payer: &'a solana_program::account_info::AccountInfo<'a>) -> &mut Self {
        self.instruction.payer = Some(payer);
        self
    }
    /// Update authority of the collection.
    ///
    #[inline(always)]
    pub fn collection_update_authority(
        &mut self,
        collection_update_authority: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.collection_update_authority = Some(collection_update_authority);
        self
    }
    /// Mint account of the collection.
    ///
    #[inline(always)]
    pub fn collection(
        &mut self,
        collection: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.collection = Some(collection);
        self
    }
    /// Update authority of the new collection NFT.
    #[inline(always)]
    pub fn new_collection_update_authority(
        &mut self,
        new_collection_update_authority: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.new_collection_update_authority = Some(new_collection_update_authority);
        self
    }
    /// New collection mint.
    ///
    #[inline(always)]
    pub fn new_collection(
        &mut self,
        new_collection: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.new_collection = Some(new_collection);
        self
    }
    /// Token Metadata program.
    ///
    #[inline(always)]
    pub fn mpl_core_program(
        &mut self,
        mpl_core_program: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.mpl_core_program = Some(mpl_core_program);
        self
    }
    /// System program.
    #[inline(always)]
    pub fn system_program(
        &mut self,
        system_program: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.system_program = Some(system_program);
        self
    }
    /// Instructions sysvar account.
    ///
    #[inline(always)]
    pub fn sysvar_instructions(
        &mut self,
        sysvar_instructions: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.sysvar_instructions = Some(sysvar_instructions);
        self
    }
    #[allow(clippy::clone_on_copy)]
    pub fn build(&self) -> SetCollectionCpi<'a> {
        SetCollectionCpi {
            __program: self.instruction.__program,

            candy_machine: self
                .instruction
                .candy_machine
                .expect("candy_machine is not set"),

            authority: self.instruction.authority.expect("authority is not set"),

            authority_pda: self
                .instruction
                .authority_pda
                .expect("authority_pda is not set"),

            payer: self.instruction.payer.expect("payer is not set"),

            collection_update_authority: self
                .instruction
                .collection_update_authority
                .expect("collection_update_authority is not set"),

            collection: self.instruction.collection.expect("collection is not set"),

            new_collection_update_authority: self
                .instruction
                .new_collection_update_authority
                .expect("new_collection_update_authority is not set"),

            new_collection: self
                .instruction
                .new_collection
                .expect("new_collection is not set"),

            mpl_core_program: self
                .instruction
                .mpl_core_program
                .expect("mpl_core_program is not set"),

            system_program: self
                .instruction
                .system_program
                .expect("system_program is not set"),

            sysvar_instructions: self
                .instruction
                .sysvar_instructions
                .expect("sysvar_instructions is not set"),
        }
    }
}

struct SetCollectionCpiBuilderInstruction<'a> {
    __program: &'a solana_program::account_info::AccountInfo<'a>,
    candy_machine: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    authority: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    authority_pda: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    payer: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    collection_update_authority: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    collection: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    new_collection_update_authority: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    new_collection: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    mpl_core_program: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    system_program: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    sysvar_instructions: Option<&'a solana_program::account_info::AccountInfo<'a>>,
}
