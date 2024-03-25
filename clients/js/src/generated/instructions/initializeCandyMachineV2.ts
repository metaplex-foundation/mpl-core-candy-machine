/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import {
  Amount,
  Context,
  Option,
  OptionOrNullable,
  Pda,
  PublicKey,
  Signer,
  TransactionBuilder,
  mapAmountSerializer,
  none,
  publicKey,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import {
  Serializer,
  array,
  bool,
  mapSerializer,
  option,
  string,
  struct,
  u16,
  u64,
  u8,
} from '@metaplex-foundation/umi/serializers';
import { findCandyMachineAuthorityPda } from '../../hooked';
import {
  ResolvedAccount,
  ResolvedAccountsWithIndices,
  expectPublicKey,
  getAccountMetasAndSigners,
} from '../shared';
import {
  ConfigLineSettings,
  ConfigLineSettingsArgs,
  Creator,
  CreatorArgs,
  HiddenSettings,
  HiddenSettingsArgs,
  getConfigLineSettingsSerializer,
  getCreatorSerializer,
  getHiddenSettingsSerializer,
} from '../types';

// Accounts.
export type InitializeCandyMachineV2InstructionAccounts = {
  /**
   * Candy Machine account. The account space must be allocated to allow accounts larger
   * than 10kb.
   *
   */

  candyMachine: PublicKey | Pda;
  /**
   * Authority PDA used to verify minted NFTs to the collection.
   *
   */

  authorityPda?: PublicKey | Pda;
  /**
   * Candy Machine authority. This is the address that controls the upate of the candy machine.
   *
   */

  authority?: PublicKey | Pda;
  /** Payer of the transaction. */
  payer?: Signer;
  /**
   * Mint account of the collection.
   *
   */

  collection: PublicKey | Pda;
  /**
   * Update authority of the collection. This needs to be a signer so the candy
   * machine can approve a delegate to verify minted NFTs to the collection.
   */

  collectionUpdateAuthority: Signer;
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
};

// Data.
export type InitializeCandyMachineV2InstructionData = {
  discriminator: Array<number>;
  /** Number of assets available */
  itemsAvailable: bigint;
  /** Symbol for the asset */
  symbol: string;
  /** Secondary sales royalty basis points (0-10000) */
  sellerFeeBasisPoints: Amount<'%', 2>;
  /** Max supply of each individual asset (default 0) */
  maxEditionSupply: bigint;
  /** Indicates if the asset is mutable or not (default yes) */
  isMutable: boolean;
  /** List of creators */
  creators: Array<Creator>;
  /** Config line settings */
  configLineSettings: Option<ConfigLineSettings>;
  /** Hidden setttings */
  hiddenSettings: Option<HiddenSettings>;
};

export type InitializeCandyMachineV2InstructionDataArgs = {
  /** Number of assets available */
  itemsAvailable: number | bigint;
  /** Symbol for the asset */
  symbol?: string;
  /** Secondary sales royalty basis points (0-10000) */
  sellerFeeBasisPoints: Amount<'%', 2>;
  /** Max supply of each individual asset (default 0) */
  maxEditionSupply?: number | bigint;
  /** Indicates if the asset is mutable or not (default yes) */
  isMutable?: boolean;
  /** List of creators */
  creators: Array<CreatorArgs>;
  /** Config line settings */
  configLineSettings?: OptionOrNullable<ConfigLineSettingsArgs>;
  /** Hidden setttings */
  hiddenSettings?: OptionOrNullable<HiddenSettingsArgs>;
};

export function getInitializeCandyMachineV2InstructionDataSerializer(): Serializer<
  InitializeCandyMachineV2InstructionDataArgs,
  InitializeCandyMachineV2InstructionData
> {
  return mapSerializer<
    InitializeCandyMachineV2InstructionDataArgs,
    any,
    InitializeCandyMachineV2InstructionData
  >(
    struct<InitializeCandyMachineV2InstructionData>(
      [
        ['discriminator', array(u8(), { size: 8 })],
        ['itemsAvailable', u64()],
        ['symbol', string()],
        ['sellerFeeBasisPoints', mapAmountSerializer(u16(), '%', 2)],
        ['maxEditionSupply', u64()],
        ['isMutable', bool()],
        ['creators', array(getCreatorSerializer())],
        ['configLineSettings', option(getConfigLineSettingsSerializer())],
        ['hiddenSettings', option(getHiddenSettingsSerializer())],
      ],
      { description: 'InitializeCandyMachineV2InstructionData' }
    ),
    (value) => ({
      ...value,
      discriminator: [67, 153, 175, 39, 218, 16, 38, 32],
      symbol: value.symbol ?? '',
      maxEditionSupply: value.maxEditionSupply ?? 0,
      isMutable: value.isMutable ?? true,
      configLineSettings: value.configLineSettings ?? none(),
      hiddenSettings: value.hiddenSettings ?? none(),
    })
  ) as Serializer<
    InitializeCandyMachineV2InstructionDataArgs,
    InitializeCandyMachineV2InstructionData
  >;
}

// Args.
export type InitializeCandyMachineV2InstructionArgs =
  InitializeCandyMachineV2InstructionDataArgs;

// Instruction.
export function initializeCandyMachineV2(
  context: Pick<Context, 'eddsa' | 'identity' | 'payer' | 'programs'>,
  input: InitializeCandyMachineV2InstructionAccounts &
    InitializeCandyMachineV2InstructionArgs
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
    authority: { index: 2, isWritable: false, value: input.authority ?? null },
    payer: { index: 3, isWritable: true, value: input.payer ?? null },
    collection: { index: 4, isWritable: true, value: input.collection ?? null },
    collectionUpdateAuthority: {
      index: 5,
      isWritable: true,
      value: input.collectionUpdateAuthority ?? null,
    },
    mplCoreProgram: {
      index: 6,
      isWritable: false,
      value: input.mplCoreProgram ?? null,
    },
    systemProgram: {
      index: 7,
      isWritable: false,
      value: input.systemProgram ?? null,
    },
    sysvarInstructions: {
      index: 8,
      isWritable: false,
      value: input.sysvarInstructions ?? null,
    },
  };

  // Arguments.
  const resolvedArgs: InitializeCandyMachineV2InstructionArgs = { ...input };

  // Default values.
  if (!resolvedAccounts.authorityPda.value) {
    resolvedAccounts.authorityPda.value = findCandyMachineAuthorityPda(
      context,
      { candyMachine: expectPublicKey(resolvedAccounts.candyMachine.value) }
    );
  }
  if (!resolvedAccounts.authority.value) {
    resolvedAccounts.authority.value = context.identity.publicKey;
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
  const data = getInitializeCandyMachineV2InstructionDataSerializer().serialize(
    resolvedArgs as InitializeCandyMachineV2InstructionDataArgs
  );

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
