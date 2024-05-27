//! This code was AUTOGENERATED using the kinobi library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun kinobi to update it.
//!
//! [https://github.com/metaplex-foundation/kinobi]
//!

use borsh::BorshDeserialize;
use borsh::BorshSerialize;
use solana_program::pubkey::Pubkey;

/// Accounts.
pub struct SetCandyMachineAuthority {
    /// Candy Machine account.
    pub candy_machine: solana_program::pubkey::Pubkey,
    /// Autority of the candy machine.
    pub authority: solana_program::pubkey::Pubkey,
}

impl SetCandyMachineAuthority {
    #[allow(clippy::vec_init_then_push)]
    pub fn instruction(
        &self,
        args: SetCandyMachineAuthorityInstructionArgs,
    ) -> solana_program::instruction::Instruction {
        let mut accounts = Vec::with_capacity(2);
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.candy_machine,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.authority,
            true,
        ));
        let mut data = SetCandyMachineAuthorityInstructionData::new()
            .try_to_vec()
            .unwrap();
        let mut args = args.try_to_vec().unwrap();
        data.append(&mut args);

        solana_program::instruction::Instruction {
            program_id: crate::MPL_CORE_CANDY_MACHINE_CORE_ID,
            accounts,
            data,
        }
    }
}

#[derive(BorshDeserialize, BorshSerialize)]
struct SetCandyMachineAuthorityInstructionData {
    discriminator: [u8; 8],
}

impl SetCandyMachineAuthorityInstructionData {
    fn new() -> Self {
        Self {
            discriminator: [133, 250, 37, 21, 110, 163, 26, 121],
        }
    }
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct SetCandyMachineAuthorityInstructionArgs {
    pub new_authority: Pubkey,
}

/// Instruction builder.
#[derive(Default)]
pub struct SetCandyMachineAuthorityBuilder {
    candy_machine: Option<solana_program::pubkey::Pubkey>,
    authority: Option<solana_program::pubkey::Pubkey>,
    new_authority: Option<Pubkey>,
}

impl SetCandyMachineAuthorityBuilder {
    pub fn new() -> Self {
        Self::default()
    }
    /// Candy Machine account.
    #[inline(always)]
    pub fn candy_machine(&mut self, candy_machine: solana_program::pubkey::Pubkey) -> &mut Self {
        self.candy_machine = Some(candy_machine);
        self
    }
    /// Autority of the candy machine.
    #[inline(always)]
    pub fn authority(&mut self, authority: solana_program::pubkey::Pubkey) -> &mut Self {
        self.authority = Some(authority);
        self
    }
    #[inline(always)]
    pub fn new_authority(&mut self, new_authority: Pubkey) -> &mut Self {
        self.new_authority = Some(new_authority);
        self
    }
    #[allow(clippy::clone_on_copy)]
    pub fn build(&self) -> solana_program::instruction::Instruction {
        let accounts = SetCandyMachineAuthority {
            candy_machine: self.candy_machine.expect("candy_machine is not set"),
            authority: self.authority.expect("authority is not set"),
        };
        let args = SetCandyMachineAuthorityInstructionArgs {
            new_authority: self
                .new_authority
                .clone()
                .expect("new_authority is not set"),
        };

        accounts.instruction(args)
    }
}

/// `set_candy_machine_authority` CPI instruction.
pub struct SetCandyMachineAuthorityCpi<'a> {
    /// The program to invoke.
    pub __program: &'a solana_program::account_info::AccountInfo<'a>,
    /// Candy Machine account.
    pub candy_machine: &'a solana_program::account_info::AccountInfo<'a>,
    /// Autority of the candy machine.
    pub authority: &'a solana_program::account_info::AccountInfo<'a>,
    /// The arguments for the instruction.
    pub __args: SetCandyMachineAuthorityInstructionArgs,
}

impl<'a> SetCandyMachineAuthorityCpi<'a> {
    pub fn invoke(&self) -> solana_program::entrypoint::ProgramResult {
        self.invoke_signed(&[])
    }
    #[allow(clippy::clone_on_copy)]
    #[allow(clippy::vec_init_then_push)]
    pub fn invoke_signed(
        &self,
        signers_seeds: &[&[&[u8]]],
    ) -> solana_program::entrypoint::ProgramResult {
        let mut accounts = Vec::with_capacity(2);
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.candy_machine.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.authority.key,
            true,
        ));
        let mut data = SetCandyMachineAuthorityInstructionData::new()
            .try_to_vec()
            .unwrap();
        let mut args = self.__args.try_to_vec().unwrap();
        data.append(&mut args);

        let instruction = solana_program::instruction::Instruction {
            program_id: crate::MPL_CORE_CANDY_MACHINE_CORE_ID,
            accounts,
            data,
        };
        let mut account_infos = Vec::with_capacity(2 + 1);
        account_infos.push(self.__program.clone());
        account_infos.push(self.candy_machine.clone());
        account_infos.push(self.authority.clone());

        if signers_seeds.is_empty() {
            solana_program::program::invoke(&instruction, &account_infos)
        } else {
            solana_program::program::invoke_signed(&instruction, &account_infos, signers_seeds)
        }
    }
}

/// `set_candy_machine_authority` CPI instruction builder.
pub struct SetCandyMachineAuthorityCpiBuilder<'a> {
    instruction: Box<SetCandyMachineAuthorityCpiBuilderInstruction<'a>>,
}

impl<'a> SetCandyMachineAuthorityCpiBuilder<'a> {
    pub fn new(program: &'a solana_program::account_info::AccountInfo<'a>) -> Self {
        let instruction = Box::new(SetCandyMachineAuthorityCpiBuilderInstruction {
            __program: program,
            candy_machine: None,
            authority: None,
            new_authority: None,
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
    /// Autority of the candy machine.
    #[inline(always)]
    pub fn authority(
        &mut self,
        authority: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.authority = Some(authority);
        self
    }
    #[inline(always)]
    pub fn new_authority(&mut self, new_authority: Pubkey) -> &mut Self {
        self.instruction.new_authority = Some(new_authority);
        self
    }
    #[allow(clippy::clone_on_copy)]
    pub fn build(&self) -> SetCandyMachineAuthorityCpi<'a> {
        let args = SetCandyMachineAuthorityInstructionArgs {
            new_authority: self
                .instruction
                .new_authority
                .clone()
                .expect("new_authority is not set"),
        };

        SetCandyMachineAuthorityCpi {
            __program: self.instruction.__program,

            candy_machine: self
                .instruction
                .candy_machine
                .expect("candy_machine is not set"),

            authority: self.instruction.authority.expect("authority is not set"),
            __args: args,
        }
    }
}

struct SetCandyMachineAuthorityCpiBuilderInstruction<'a> {
    __program: &'a solana_program::account_info::AccountInfo<'a>,
    candy_machine: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    authority: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    new_authority: Option<Pubkey>,
}
