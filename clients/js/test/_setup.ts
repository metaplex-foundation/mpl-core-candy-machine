/* eslint-disable import/no-extraneous-dependencies */
import {
  createNft as baseCreateNft,
  createProgrammableNft as baseCreateProgrammableNft,
  findMasterEditionPda,
  findMetadataPda,
  verifyCollectionV1,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  AssetV1,
  fetchAssetV1,
  createCollectionV1 as baseCreateCollection,
} from '@metaplex-foundation/mpl-core';
import {
  createAssociatedToken,
  createMint,
  findAssociatedTokenPda,
  mintTokensTo,
} from '@metaplex-foundation/mpl-toolbox';
import {
  Context,
  DateTime,
  PublicKey,
  PublicKeyInput,
  Signer,
  TransactionSignature,
  Umi,
  assertAccountExists,
  generateSigner,
  now,
  percentAmount,
  publicKey,
  some,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import { createUmi as basecreateUmi } from '@metaplex-foundation/umi-bundle-tests';
import { Assertions } from 'ava';
import {
  CandyGuardDataArgs,
  ConfigLine,
  CreateCandyGuardInstructionAccounts,
  CreateCandyGuardInstructionDataArgs,
  DefaultGuardSetArgs,
  GuardSetArgs,
  addConfigLines,
  createCandyGuard as baseCreateCandyGuard,
  createCandyMachine as baseCreateCandyMachineV2,
  findCandyGuardPda,
  mplCandyMachine,
  wrap,
} from '../src';

export const METAPLEX_DEFAULT_RULESET = publicKey(
  'eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9'
);

export const createUmi = async () =>
  (await basecreateUmi()).use(mplCandyMachine());

export const createNft = async (
  umi: Umi,
  input: Partial<Parameters<typeof baseCreateNft>[1]> = {}
): Promise<Signer> => {
  const mint = generateSigner(umi);
  await baseCreateNft(umi, {
    mint,
    ...defaultAssetData(),
    ...input,
  }).sendAndConfirm(umi);

  return mint;
};

export const createProgrammableNft = async (
  umi: Umi,
  input: Partial<Parameters<typeof baseCreateProgrammableNft>[1]> = {}
): Promise<Signer> => {
  const mint = generateSigner(umi);
  await baseCreateProgrammableNft(umi, {
    mint,
    ...defaultAssetData(),
    ...input,
  }).sendAndConfirm(umi);

  return mint;
};

export const createCollection = async (
  umi: Umi,
  input: Partial<Parameters<typeof baseCreateCollection>[1]> = {}
): Promise<Signer> => {
  const mint = generateSigner(umi);
  await baseCreateCollection(umi, {
    collection: mint,
    ...defaultAssetData(),
    ...input,
  }).sendAndConfirm(umi);

  return mint;
};

export const createCollectionNft = async (
  umi: Umi,
  input: Partial<Parameters<typeof baseCreateNft>[1]> = {}
): Promise<Signer> => createNft(umi, { ...input, isCollection: true });

export const createVerifiedNft = async (
  umi: Umi,
  input: Partial<Parameters<typeof baseCreateNft>[1]> & {
    collectionMint: PublicKey;
    collectionAuthority?: Signer;
  }
): Promise<Signer> => {
  const { collectionMint, collectionAuthority = umi.identity, ...rest } = input;
  const mint = await createNft(umi, {
    ...rest,
    collection: some({ verified: false, key: collectionMint }),
  });
  const effectiveMint = publicKey(rest.mint ?? mint.publicKey);

  await transactionBuilder()
    .add(
      verifyCollectionV1(umi, {
        authority: collectionAuthority,
        collectionMint,
        metadata: findMetadataPda(umi, { mint: effectiveMint })[0],
      })
    )
    .sendAndConfirm(umi);

  return mint;
};

export const createVerifiedProgrammableNft = async (
  umi: Umi,
  input: Partial<Parameters<typeof baseCreateNft>[1]> & {
    collectionMint: PublicKey;
    collectionAuthority?: Signer;
  }
): Promise<Signer> => {
  const { collectionMint, collectionAuthority = umi.identity, ...rest } = input;
  const mint = await createProgrammableNft(umi, {
    ...rest,
    collection: some({ verified: false, key: collectionMint }),
  });
  const effectiveMint = publicKey(rest.mint ?? mint.publicKey);

  await transactionBuilder()
    .add(
      verifyCollectionV1(umi, {
        authority: collectionAuthority,
        collectionMint,
        metadata: findMetadataPda(umi, { mint: effectiveMint })[0],
      })
    )
    .sendAndConfirm(umi);

  return mint;
};

export const createMintWithHolders = async (
  umi: Umi,
  input: Partial<Omit<Parameters<typeof createMint>[1], 'mintAuthority'>> & {
    mintAuthority?: Signer;
    holders: { owner: PublicKeyInput; amount: number | bigint }[];
  }
): Promise<[Signer, ...PublicKey[]]> => {
  const atas = [] as PublicKey[];
  const mint = input.mint ?? generateSigner(umi);
  const mintAuthority = input.mintAuthority ?? umi.identity;
  let builder = transactionBuilder().add(
    createMint(umi, {
      ...input,
      mint,
      mintAuthority: mintAuthority.publicKey,
    })
  );
  input.holders.forEach((holder) => {
    const owner = publicKey(holder.owner);
    const [token] = findAssociatedTokenPda(umi, {
      mint: mint.publicKey,
      owner,
    });
    atas.push(token);
    builder = builder.add(
      createAssociatedToken(umi, { mint: mint.publicKey, owner })
    );
    if (holder.amount > 0) {
      builder = builder.add(
        mintTokensTo(umi, {
          mint: mint.publicKey,
          token,
          amount: holder.amount,
          mintAuthority,
        })
      );
    }
  });
  await builder.sendAndConfirm(umi);

  return [mint, ...atas];
};

export const createV2 = async <DA extends GuardSetArgs = DefaultGuardSetArgs>(
  umi: Umi,
  input: Partial<Parameters<typeof baseCreateCandyMachineV2>[1]> &
    Partial<
      CandyGuardDataArgs<DA extends undefined ? DefaultGuardSetArgs : DA>
    > & { configLineIndex?: number; configLines?: ConfigLine[] } = {}
) => {
  const candyMachine = input.candyMachine ?? generateSigner(umi);
  const collection =
    input.collection ?? (await createCollection(umi)).publicKey;
  let builder = await baseCreateCandyMachineV2(umi, {
    ...defaultCandyMachineData(umi),
    ...input,
    itemsAvailable: input.itemsAvailable ?? input.configLines?.length ?? 100,
    candyMachine,
    collection,
  });

  if (input.configLines !== undefined) {
    builder = builder.add(
      addConfigLines(umi, {
        authority: input.collectionUpdateAuthority ?? umi.identity,
        candyMachine: candyMachine.publicKey,
        index: input.configLineIndex ?? 0,
        configLines: input.configLines,
      })
    );
  }

  if (input.guards !== undefined || input.groups !== undefined) {
    const candyGuard = findCandyGuardPda(umi, { base: candyMachine.publicKey });
    builder = builder
      .add(baseCreateCandyGuard<DA>(umi, { ...input, base: candyMachine }))
      .add(wrap(umi, { candyMachine: candyMachine.publicKey, candyGuard }));
  }

  await builder.sendAndConfirm(umi);
  return candyMachine;
};

export const defaultAssetData = () => ({
  name: 'My Asset',
  sellerFeeBasisPoints: percentAmount(10, 2),
  uri: 'https://example.com/my-asset.json',
  plugins: [],
});

export const defaultCandyMachineData = (
  context: Pick<Context, 'identity'>
) => ({
  collectionUpdateAuthority: context.identity,
  itemsAvailable: 100,
  configLineSettings: some({
    prefixName: '',
    nameLength: 32,
    prefixUri: '',
    uriLength: 200,
    isSequential: false,
  }),
});

export const createCandyGuard = async <
  DA extends GuardSetArgs = DefaultGuardSetArgs
>(
  umi: Umi,
  input: Partial<
    CreateCandyGuardInstructionAccounts &
      CreateCandyGuardInstructionDataArgs<
        DA extends undefined ? DefaultGuardSetArgs : DA
      >
  > = {}
) => {
  const base = input.base ?? generateSigner(umi);
  await transactionBuilder()
    .add(baseCreateCandyGuard<DA>(umi, { ...input, base }))
    .sendAndConfirm(umi);

  return findCandyGuardPda(umi, { base: base.publicKey });
};

export const assertSuccessfulMint = async (
  t: Assertions,
  umi: Umi,
  input: {
    mint: PublicKey | Signer;
    owner: PublicKey | Signer;
    name?: string | RegExp;
    uri?: string | RegExp;
    edition?: number;
  }
) => {
  const mint = publicKey(input.mint);
  const owner = publicKey(input.owner);
  const { name, uri } = input;

  // Nft.

  const nft = await fetchAssetV1(umi, mint);

  t.like(nft, <AssetV1>{
    publicKey: publicKey(mint),
    owner,
  });

  if (input.edition !== undefined) {
    t.is(nft.edition?.number, input.edition);
  }

  // Name.
  if (typeof name === 'string') t.is(nft.name, name);
  else if (name !== undefined) t.regex(nft.name, name);

  // Uri.
  if (typeof uri === 'string') t.is(nft.uri, uri);
  else if (uri !== undefined) t.regex(nft.uri, uri);
};

export const assertBotTax = async (
  t: Assertions,
  umi: Umi,
  mint: Signer | PublicKey,
  signature: TransactionSignature,
  extraRegex?: RegExp
) => {
  const transaction = await umi.rpc.getTransaction(signature);
  t.true(transaction !== null);
  const logs = transaction!.meta.logs.join('');
  t.regex(logs, /Candy Guard Botting is taxed/);
  if (extraRegex !== undefined) t.regex(logs, extraRegex);
  const [metadata] = findMetadataPda(umi, { mint: publicKey(mint) });
  t.false(await umi.rpc.accountExists(metadata));
};

export const assertBurnedNft = async (
  t: Assertions,
  umi: Umi,
  mint: Signer | PublicKey,
  owner?: Signer | PublicKey
) => {
  owner = owner ?? umi.identity;
  const [tokenAccount] = findAssociatedTokenPda(umi, {
    mint: publicKey(mint),
    owner: publicKey(owner),
  });
  const [metadataAccount] = findMetadataPda(umi, { mint: publicKey(mint) });
  const [editionAccount] = findMasterEditionPda(umi, { mint: publicKey(mint) });

  const metadata = await umi.rpc.getAccount(metadataAccount);
  // Metadata accounts is not closed since it contains fees but
  // the data length should be 1.
  t.true(metadata.exists);
  assertAccountExists(metadata);
  t.true(metadata.data.length === 1);

  t.false(await umi.rpc.accountExists(tokenAccount));
  t.false(await umi.rpc.accountExists(editionAccount));
};

export const yesterday = (): DateTime => now() - 3600n * 24n;
export const tomorrow = (): DateTime => now() + 3600n * 24n;

// TODO move to mpl-core
export const isFrozen = (asset: AssetV1): boolean =>
  asset.freezeDelegate?.frozen || false;
