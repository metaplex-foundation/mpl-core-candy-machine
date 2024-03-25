/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import {
  Context,
  Pda,
  PublicKey,
  Signer,
  TransactionBuilder,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import {
  Serializer,
  array,
  mapSerializer,
  struct,
  u8,
} from '@metaplex-foundation/umi/serializers';
import {
  ResolvedAccount,
  ResolvedAccountsWithIndices,
  getAccountMetasAndSigners,
} from '../shared';
import {
  CandyMachineData,
  CandyMachineDataArgs,
  getCandyMachineDataSerializer,
} from '../types';

// Accounts.
export type UpdateCandyMachineInstructionAccounts = {
  /** Candy Machine account. */
  candyMachine: PublicKey | Pda;
  /** Authority of the candy machine. */
  authority?: Signer;
};

// Data.
export type UpdateCandyMachineInstructionData = {
  discriminator: Array<number>;
  data: CandyMachineData;
};

export type UpdateCandyMachineInstructionDataArgs = {
  data: CandyMachineDataArgs;
};

export function getUpdateCandyMachineInstructionDataSerializer(): Serializer<
  UpdateCandyMachineInstructionDataArgs,
  UpdateCandyMachineInstructionData
> {
  return mapSerializer<
    UpdateCandyMachineInstructionDataArgs,
    any,
    UpdateCandyMachineInstructionData
  >(
    struct<UpdateCandyMachineInstructionData>(
      [
        ['discriminator', array(u8(), { size: 8 })],
        ['data', getCandyMachineDataSerializer()],
      ],
      { description: 'UpdateCandyMachineInstructionData' }
    ),
    (value) => ({
      ...value,
      discriminator: [219, 200, 88, 176, 158, 63, 253, 127],
    })
  ) as Serializer<
    UpdateCandyMachineInstructionDataArgs,
    UpdateCandyMachineInstructionData
  >;
}

// Args.
export type UpdateCandyMachineInstructionArgs =
  UpdateCandyMachineInstructionDataArgs;

// Instruction.
export function updateCandyMachine(
  context: Pick<Context, 'identity' | 'programs'>,
  input: UpdateCandyMachineInstructionAccounts &
    UpdateCandyMachineInstructionArgs
): TransactionBuilder {
  // Program ID.
  const programId = context.programs.getPublicKey(
    'mplCoreCandyMachineCore',
    'CMACYFENjoBMHzapRXyo1JZkVS6EtaDDzkjMrmQLvr4J'
  );

  // Accounts.
  const resolvedAccounts: ResolvedAccountsWithIndices = {
    candyMachine: {
      index: 0,
      isWritable: true,
      value: input.candyMachine ?? null,
    },
    authority: { index: 1, isWritable: false, value: input.authority ?? null },
  };

  // Arguments.
  const resolvedArgs: UpdateCandyMachineInstructionArgs = { ...input };

  // Default values.
  if (!resolvedAccounts.authority.value) {
    resolvedAccounts.authority.value = context.identity;
  }

  // Accounts in order.
  const orderedAccounts: ResolvedAccount[] = Object.values(
    resolvedAccounts
  ).sort((a, b) => a.index - b.index);

  // Keys and Signers.
  const [keys, signers] = getAccountMetasAndSigners(
    orderedAccounts,
    'programId',
    programId
  );

  // Data.
  const data = getUpdateCandyMachineInstructionDataSerializer().serialize(
    resolvedArgs as UpdateCandyMachineInstructionDataArgs
  );

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
