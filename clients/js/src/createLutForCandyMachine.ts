import {
  getMplTokenMetadataProgramId,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  createLut,
  getSysvar,
  getSplAssociatedTokenProgramId,
  getSplTokenProgramId,
} from '@metaplex-foundation/mpl-toolbox';
import {
  AddressLookupTableInput,
  Context,
  PublicKey,
  Signer,
  TransactionBuilder,
  uniquePublicKeys,
} from '@metaplex-foundation/umi';
import { getMplCoreProgramId } from 'core-preview';
import {
  fetchCandyMachine,
  getMplCandyMachineCoreAssetProgramId,
} from './generated';
import { findCandyMachineAuthorityPda } from './hooked';

export const createLutForCandyMachine = async (
  context: Pick<Context, 'rpc' | 'eddsa' | 'programs' | 'identity' | 'payer'>,
  recentSlot: number,
  candyMachine: PublicKey,
  collectionUpdateAuthority?: PublicKey,
  lutAuthority?: Signer
): Promise<[TransactionBuilder, AddressLookupTableInput]> => {
  const addresses = await getLutAddressesForCandyMachine(
    context,
    candyMachine,
    collectionUpdateAuthority
  );

  return createLut(context, {
    recentSlot,
    addresses,
    authority: lutAuthority,
  });
};

export const getLutAddressesForCandyMachine = async (
  context: Pick<Context, 'rpc' | 'eddsa' | 'programs' | 'identity'>,
  candyMachine: PublicKey,
  collectionUpdateAuthority?: PublicKey
): Promise<PublicKey[]> => {
  const candyMachineAccount = await fetchCandyMachine(context, candyMachine);
  const { mintAuthority, collectionMint } = candyMachineAccount;
  collectionUpdateAuthority ??= context.identity.publicKey;

  return uniquePublicKeys([
    candyMachine,
    mintAuthority,
    collectionMint,
    collectionUpdateAuthority,
    findCandyMachineAuthorityPda(context, { candyMachine })[0],
    getSysvar('instructions'),
    getSysvar('slotHashes'),
    getMplCoreProgramId(context),
    getSplTokenProgramId(context),
    getSplAssociatedTokenProgramId(context),
    getMplTokenMetadataProgramId(context),
    getMplCandyMachineCoreAssetProgramId(context),
  ]);
};
