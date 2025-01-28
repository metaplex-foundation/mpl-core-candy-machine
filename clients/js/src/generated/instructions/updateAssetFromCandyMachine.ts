/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import {
  PluginAuthorityPair,
  PluginAuthorityPairArgs,
  getPluginAuthorityPairSerializer,
} from '@metaplex-foundation/mpl-core';
import {
  Context,
  Pda,
  PublicKey,
  Signer,
  TransactionBuilder,
  publicKey,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import {
  Serializer,
  array,
  mapSerializer,
  struct,
  u8,
} from '@metaplex-foundation/umi/serializers';
import { findCandyMachineAuthorityPda } from '../../hooked';
import {
  PickPartial,
  ResolvedAccount,
  ResolvedAccountsWithIndices,
  expectPublicKey,
  getAccountMetasAndSigners,
} from '../shared';

// Accounts.
export type UpdateAssetFromCandyMachineInstructionAccounts = {
  /** Candy machine account. */
  candyMachine: PublicKey | Pda;
  /**
   * Candy machine authority account. This is the account that holds a delegate
   * to verify an item into the collection.
   *
   */

  authorityPda?: PublicKey | Pda;
  /** Candy machine mint authority (mint only allowed for the mint_authority). */
  mintAuthority: Signer;
  /** Payer for the transaction and account allocation (rent). */
  payer?: Signer;
  /**
   * NFT account owner.
   *
   */

  assetOwner: PublicKey | Pda;
  /**
   * Mint account of the NFT. The account will be initialized if necessary.
   *
   */

  asset: PublicKey | Pda;
  /**
   * Mint account of the collection NFT.
   *
   */

  collection: PublicKey | Pda;
  /**
   * Token Metadata program.
   *
   */

  mplCoreProgram?: PublicKey | Pda;
  /** System program. */
  systemProgram?: PublicKey | Pda;
  /**
   * Instructions sysvar account.
   *
   */

  sysvarInstructions?: PublicKey | Pda;
  /**
   * SlotHashes sysvar cluster data.
   *
   */

  recentSlothashes?: PublicKey | Pda;
};

// Data.
export type UpdateAssetFromCandyMachineInstructionData = {
  discriminator: Array<number>;
  plugins: Array<PluginAuthorityPair>;
};

export type UpdateAssetFromCandyMachineInstructionDataArgs = {
  plugins: Array<PluginAuthorityPairArgs>;
};

export function getUpdateAssetFromCandyMachineInstructionDataSerializer(): Serializer<
  UpdateAssetFromCandyMachineInstructionDataArgs,
  UpdateAssetFromCandyMachineInstructionData
> {
  return mapSerializer<
    UpdateAssetFromCandyMachineInstructionDataArgs,
    any,
    UpdateAssetFromCandyMachineInstructionData
  >(
    struct<UpdateAssetFromCandyMachineInstructionData>(
      [
        ['discriminator', array(u8(), { size: 8 })],
        ['plugins', array(getPluginAuthorityPairSerializer())],
      ],
      { description: 'UpdateAssetFromCandyMachineInstructionData' }
    ),
    (value) => ({
      ...value,
      discriminator: [56, 126, 238, 138, 192, 118, 228, 172],
    })
  ) as Serializer<
    UpdateAssetFromCandyMachineInstructionDataArgs,
    UpdateAssetFromCandyMachineInstructionData
  >;
}

// Args.
export type UpdateAssetFromCandyMachineInstructionArgs = PickPartial<
  UpdateAssetFromCandyMachineInstructionDataArgs,
  'plugins'
>;

// Instruction.
export function updateAssetFromCandyMachine(
  context: Pick<Context, 'eddsa' | 'payer' | 'programs'>,
  input: UpdateAssetFromCandyMachineInstructionAccounts &
    UpdateAssetFromCandyMachineInstructionArgs
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
    authorityPda: {
      index: 1,
      isWritable: true,
      value: input.authorityPda ?? null,
    },
    mintAuthority: {
      index: 2,
      isWritable: false,
      value: input.mintAuthority ?? null,
    },
    payer: { index: 3, isWritable: true, value: input.payer ?? null },
    assetOwner: {
      index: 4,
      isWritable: false,
      value: input.assetOwner ?? null,
    },
    asset: { index: 5, isWritable: true, value: input.asset ?? null },
    collection: { index: 6, isWritable: true, value: input.collection ?? null },
    mplCoreProgram: {
      index: 7,
      isWritable: false,
      value: input.mplCoreProgram ?? null,
    },
    systemProgram: {
      index: 8,
      isWritable: false,
      value: input.systemProgram ?? null,
    },
    sysvarInstructions: {
      index: 9,
      isWritable: false,
      value: input.sysvarInstructions ?? null,
    },
    recentSlothashes: {
      index: 10,
      isWritable: false,
      value: input.recentSlothashes ?? null,
    },
  };

  // Arguments.
  const resolvedArgs: UpdateAssetFromCandyMachineInstructionArgs = { ...input };

  // Default values.
  if (!resolvedAccounts.authorityPda.value) {
    resolvedAccounts.authorityPda.value = findCandyMachineAuthorityPda(
      context,
      { candyMachine: expectPublicKey(resolvedAccounts.candyMachine.value) }
    );
  }
  if (!resolvedAccounts.payer.value) {
    resolvedAccounts.payer.value = context.payer;
  }
  if (!resolvedAccounts.mplCoreProgram.value) {
    resolvedAccounts.mplCoreProgram.value = context.programs.getPublicKey(
      'mplCore',
      'CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d'
    );
    resolvedAccounts.mplCoreProgram.isWritable = false;
  }
  if (!resolvedAccounts.systemProgram.value) {
    resolvedAccounts.systemProgram.value = context.programs.getPublicKey(
      'splSystem',
      '11111111111111111111111111111111'
    );
    resolvedAccounts.systemProgram.isWritable = false;
  }
  if (!resolvedAccounts.sysvarInstructions.value) {
    resolvedAccounts.sysvarInstructions.value = publicKey(
      'Sysvar1nstructions1111111111111111111111111'
    );
  }
  if (!resolvedAccounts.recentSlothashes.value) {
    resolvedAccounts.recentSlothashes.value = publicKey(
      'SysvarS1otHashes111111111111111111111111111'
    );
  }
  if (!resolvedArgs.plugins) {
    resolvedArgs.plugins = [];
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
  const data =
    getUpdateAssetFromCandyMachineInstructionDataSerializer().serialize(
      resolvedArgs as UpdateAssetFromCandyMachineInstructionDataArgs
    );

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
