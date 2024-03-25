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
  bytes,
  mapSerializer,
  struct,
  u32,
  u8,
} from '@metaplex-foundation/umi/serializers';
import {
  ResolvedAccount,
  ResolvedAccountsWithIndices,
  getAccountMetasAndSigners,
} from '../shared';

// Accounts.
export type UpdateCandyGuardInstructionAccounts = {
  candyGuard: PublicKey | Pda;
  authority?: Signer;
  payer?: Signer;
  systemProgram?: PublicKey | Pda;
};

// Data.
export type UpdateCandyGuardInstructionData = {
  discriminator: Array<number>;
  data: Uint8Array;
};

export type UpdateCandyGuardInstructionDataArgs = { data: Uint8Array };

export function getUpdateCandyGuardInstructionDataSerializer(): Serializer<
  UpdateCandyGuardInstructionDataArgs,
  UpdateCandyGuardInstructionData
> {
  return mapSerializer<
    UpdateCandyGuardInstructionDataArgs,
    any,
    UpdateCandyGuardInstructionData
  >(
    struct<UpdateCandyGuardInstructionData>(
      [
        ['discriminator', array(u8(), { size: 8 })],
        ['data', bytes({ size: u32() })],
      ],
      { description: 'UpdateCandyGuardInstructionData' }
    ),
    (value) => ({
      ...value,
      discriminator: [219, 200, 88, 176, 158, 63, 253, 127],
    })
  ) as Serializer<
    UpdateCandyGuardInstructionDataArgs,
    UpdateCandyGuardInstructionData
  >;
}

// Args.
export type UpdateCandyGuardInstructionArgs =
  UpdateCandyGuardInstructionDataArgs;

// Instruction.
export function updateCandyGuard(
  context: Pick<Context, 'identity' | 'payer' | 'programs'>,
  input: UpdateCandyGuardInstructionAccounts & UpdateCandyGuardInstructionArgs
): TransactionBuilder {
  // Program ID.
  const programId = context.programs.getPublicKey(
    'mplCoreCandyGuard',
    'CMAGAKJ67e9hRZgfC5SFTbZH8MgEmtqazKXjmkaJjWTJ'
  );

  // Accounts.
  const resolvedAccounts: ResolvedAccountsWithIndices = {
    candyGuard: { index: 0, isWritable: true, value: input.candyGuard ?? null },
    authority: { index: 1, isWritable: false, value: input.authority ?? null },
    payer: { index: 2, isWritable: false, value: input.payer ?? null },
    systemProgram: {
      index: 3,
      isWritable: false,
      value: input.systemProgram ?? null,
    },
  };

  // Arguments.
  const resolvedArgs: UpdateCandyGuardInstructionArgs = { ...input };

  // Default values.
  if (!resolvedAccounts.authority.value) {
    resolvedAccounts.authority.value = context.identity;
  }
  if (!resolvedAccounts.payer.value) {
    resolvedAccounts.payer.value = context.payer;
  }
  if (!resolvedAccounts.systemProgram.value) {
    resolvedAccounts.systemProgram.value = context.programs.getPublicKey(
      'splSystem',
      '11111111111111111111111111111111'
    );
    resolvedAccounts.systemProgram.isWritable = false;
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
  const data = getUpdateCandyGuardInstructionDataSerializer().serialize(
    resolvedArgs as UpdateCandyGuardInstructionDataArgs
  );

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
