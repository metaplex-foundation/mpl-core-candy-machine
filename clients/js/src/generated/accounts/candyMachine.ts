/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import {
  Account,
  Context,
  Pda,
  PublicKey,
  RpcAccount,
  RpcGetAccountOptions,
  RpcGetAccountsOptions,
  assertAccountExists,
  deserializeAccount,
  gpaBuilder,
  publicKey as toPublicKey,
} from '@metaplex-foundation/umi';
import {
  array,
  publicKey as publicKeySerializer,
  u64,
  u8,
} from '@metaplex-foundation/umi/serializers';
import {
  CandyMachineAccountData,
  getCandyMachineAccountDataSerializer,
} from '../../hooked';
import {
  AccountVersionArgs,
  CandyMachineDataArgs,
  getAccountVersionSerializer,
  getCandyMachineDataSerializer,
} from '../types';

/** Candy machine state and config data. */
export type CandyMachine = Account<CandyMachineAccountData>;

export function deserializeCandyMachine(rawAccount: RpcAccount): CandyMachine {
  return deserializeAccount(rawAccount, getCandyMachineAccountDataSerializer());
}

export async function fetchCandyMachine(
  context: Pick<Context, 'rpc'>,
  publicKey: PublicKey | Pda,
  options?: RpcGetAccountOptions
): Promise<CandyMachine> {
  const maybeAccount = await context.rpc.getAccount(
    toPublicKey(publicKey, false),
    options
  );
  assertAccountExists(maybeAccount, 'CandyMachine');
  return deserializeCandyMachine(maybeAccount);
}

export async function safeFetchCandyMachine(
  context: Pick<Context, 'rpc'>,
  publicKey: PublicKey | Pda,
  options?: RpcGetAccountOptions
): Promise<CandyMachine | null> {
  const maybeAccount = await context.rpc.getAccount(
    toPublicKey(publicKey, false),
    options
  );
  return maybeAccount.exists ? deserializeCandyMachine(maybeAccount) : null;
}

export async function fetchAllCandyMachine(
  context: Pick<Context, 'rpc'>,
  publicKeys: Array<PublicKey | Pda>,
  options?: RpcGetAccountsOptions
): Promise<CandyMachine[]> {
  const maybeAccounts = await context.rpc.getAccounts(
    publicKeys.map((key) => toPublicKey(key, false)),
    options
  );
  return maybeAccounts.map((maybeAccount) => {
    assertAccountExists(maybeAccount, 'CandyMachine');
    return deserializeCandyMachine(maybeAccount);
  });
}

export async function safeFetchAllCandyMachine(
  context: Pick<Context, 'rpc'>,
  publicKeys: Array<PublicKey | Pda>,
  options?: RpcGetAccountsOptions
): Promise<CandyMachine[]> {
  const maybeAccounts = await context.rpc.getAccounts(
    publicKeys.map((key) => toPublicKey(key, false)),
    options
  );
  return maybeAccounts
    .filter((maybeAccount) => maybeAccount.exists)
    .map((maybeAccount) => deserializeCandyMachine(maybeAccount as RpcAccount));
}

export function getCandyMachineGpaBuilder(
  context: Pick<Context, 'rpc' | 'programs'>
) {
  const programId = context.programs.getPublicKey(
    'mplCoreCandyMachineCore',
    'CMACYFENjoBMHzapRXyo1JZkVS6EtaDDzkjMrmQLvr4J'
  );
  return gpaBuilder(context, programId)
    .registerFields<{
      discriminator: Array<number>;
      version: AccountVersionArgs;
      authority: PublicKey;
      mintAuthority: PublicKey;
      collectionMint: PublicKey;
      itemsRedeemed: number | bigint;
      data: CandyMachineDataArgs;
    }>({
      discriminator: [0, array(u8(), { size: 8 })],
      version: [8, getAccountVersionSerializer()],
      authority: [9, publicKeySerializer()],
      mintAuthority: [41, publicKeySerializer()],
      collectionMint: [73, publicKeySerializer()],
      itemsRedeemed: [105, u64()],
      data: [113, getCandyMachineDataSerializer()],
    })
    .deserializeUsing<CandyMachine>((account) =>
      deserializeCandyMachine(account)
    )
    .whereField('discriminator', [51, 173, 177, 113, 25, 241, 109, 189]);
}
