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
  Serializer,
  publicKey as publicKeySerializer,
  string,
  struct,
  u16,
  u8,
} from '@metaplex-foundation/umi/serializers';

/** PDA to track the number of mints for an individual address. */
export type AssetMintCounter = Account<AssetMintCounterAccountData>;

export type AssetMintCounterAccountData = { count: number };

export type AssetMintCounterAccountDataArgs = AssetMintCounterAccountData;

export function getAssetMintCounterAccountDataSerializer(): Serializer<
  AssetMintCounterAccountDataArgs,
  AssetMintCounterAccountData
> {
  return struct<AssetMintCounterAccountData>([['count', u16()]], {
    description: 'AssetMintCounterAccountData',
  }) as Serializer<
    AssetMintCounterAccountDataArgs,
    AssetMintCounterAccountData
  >;
}

export function deserializeAssetMintCounter(
  rawAccount: RpcAccount
): AssetMintCounter {
  return deserializeAccount(
    rawAccount,
    getAssetMintCounterAccountDataSerializer()
  );
}

export async function fetchAssetMintCounter(
  context: Pick<Context, 'rpc'>,
  publicKey: PublicKey | Pda,
  options?: RpcGetAccountOptions
): Promise<AssetMintCounter> {
  const maybeAccount = await context.rpc.getAccount(
    toPublicKey(publicKey, false),
    options
  );
  assertAccountExists(maybeAccount, 'AssetMintCounter');
  return deserializeAssetMintCounter(maybeAccount);
}

export async function safeFetchAssetMintCounter(
  context: Pick<Context, 'rpc'>,
  publicKey: PublicKey | Pda,
  options?: RpcGetAccountOptions
): Promise<AssetMintCounter | null> {
  const maybeAccount = await context.rpc.getAccount(
    toPublicKey(publicKey, false),
    options
  );
  return maybeAccount.exists ? deserializeAssetMintCounter(maybeAccount) : null;
}

export async function fetchAllAssetMintCounter(
  context: Pick<Context, 'rpc'>,
  publicKeys: Array<PublicKey | Pda>,
  options?: RpcGetAccountsOptions
): Promise<AssetMintCounter[]> {
  const maybeAccounts = await context.rpc.getAccounts(
    publicKeys.map((key) => toPublicKey(key, false)),
    options
  );
  return maybeAccounts.map((maybeAccount) => {
    assertAccountExists(maybeAccount, 'AssetMintCounter');
    return deserializeAssetMintCounter(maybeAccount);
  });
}

export async function safeFetchAllAssetMintCounter(
  context: Pick<Context, 'rpc'>,
  publicKeys: Array<PublicKey | Pda>,
  options?: RpcGetAccountsOptions
): Promise<AssetMintCounter[]> {
  const maybeAccounts = await context.rpc.getAccounts(
    publicKeys.map((key) => toPublicKey(key, false)),
    options
  );
  return maybeAccounts
    .filter((maybeAccount) => maybeAccount.exists)
    .map((maybeAccount) =>
      deserializeAssetMintCounter(maybeAccount as RpcAccount)
    );
}

export function getAssetMintCounterGpaBuilder(
  context: Pick<Context, 'rpc' | 'programs'>
) {
  const programId = context.programs.getPublicKey(
    'mplCoreCandyGuard',
    'CMAGAKJ67e9hRZgfC5SFTbZH8MgEmtqazKXjmkaJjWTJ'
  );
  return gpaBuilder(context, programId)
    .registerFields<{ count: number }>({ count: [0, u16()] })
    .deserializeUsing<AssetMintCounter>((account) =>
      deserializeAssetMintCounter(account)
    )
    .whereSize(2);
}

export function getAssetMintCounterSize(): number {
  return 2;
}

export function findAssetMintCounterPda(
  context: Pick<Context, 'eddsa' | 'programs'>,
  seeds: {
    /** A unique identifier in the context of a Asset mint/Candy Machine/Candy Guard combo */
    id: number;
    /** The address of the Asset */
    asset: PublicKey;
    /** The address of the Candy Guard account */
    candyGuard: PublicKey;
    /** The address of the Candy Machine account */
    candyMachine: PublicKey;
  }
): Pda {
  const programId = context.programs.getPublicKey(
    'mplCoreCandyGuard',
    'CMAGAKJ67e9hRZgfC5SFTbZH8MgEmtqazKXjmkaJjWTJ'
  );
  return context.eddsa.findPda(programId, [
    string({ size: 'variable' }).serialize('asset_mint_limit'),
    u8().serialize(seeds.id),
    publicKeySerializer().serialize(seeds.asset),
    publicKeySerializer().serialize(seeds.candyGuard),
    publicKeySerializer().serialize(seeds.candyMachine),
  ]);
}

export async function fetchAssetMintCounterFromSeeds(
  context: Pick<Context, 'eddsa' | 'programs' | 'rpc'>,
  seeds: Parameters<typeof findAssetMintCounterPda>[1],
  options?: RpcGetAccountOptions
): Promise<AssetMintCounter> {
  return fetchAssetMintCounter(
    context,
    findAssetMintCounterPda(context, seeds),
    options
  );
}

export async function safeFetchAssetMintCounterFromSeeds(
  context: Pick<Context, 'eddsa' | 'programs' | 'rpc'>,
  seeds: Parameters<typeof findAssetMintCounterPda>[1],
  options?: RpcGetAccountOptions
): Promise<AssetMintCounter | null> {
  return safeFetchAssetMintCounter(
    context,
    findAssetMintCounterPda(context, seeds),
    options
  );
}
