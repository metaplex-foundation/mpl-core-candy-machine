import {
  generateSigner,
  none,
  publicKey,
  some,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import test from 'ava';
import {
  AccountVersion,
  CandyMachine,
  createCandyMachineV2,
  fetchCandyMachine,
  MintType,
} from '../src';
import { createCollection, createUmi, defaultCandyMachineData } from './_setup';

test('it can create a candy machine using config line settings', async (t) => {
  // Given an existing collection NFT.
  const umi = await createUmi();
  const collection = await createCollection(umi);

  // When we create a new candy machine with config line settings.
  const candyMachine = generateSigner(umi);
  await transactionBuilder()
    .add(
      await createCandyMachineV2(umi, {
        candyMachine,
        mintType: MintType.Core,
        collection: collection.publicKey,
        collectionUpdateAuthority: umi.identity,
        itemsAvailable: 100,
        configLineSettings: some({
          prefixName: 'My NFT #',
          nameLength: 8,
          prefixUri: 'https://example.com/',
          uriLength: 20,
          isSequential: false,
        }),
      })
    )
    .sendAndConfirm(umi);

  // Then we expect the candy machine account to have the right data.
  const candyMachineAccount = await fetchCandyMachine(
    umi,
    candyMachine.publicKey
  );
  t.like(candyMachineAccount, <CandyMachine>{
    publicKey: publicKey(candyMachine),
    authority: publicKey(umi.identity),
    mintAuthority: publicKey(umi.identity),
    collectionMint: publicKey(collection),
    version: AccountVersion.V2,
    itemsRedeemed: 0n,
    mintType: MintType.Core,
    data: {
      itemsAvailable: 100n,
      maxEditionSupply: 0n,
      isMutable: true,
      configLineSettings: some({
        prefixName: 'My NFT #',
        nameLength: 8,
        prefixUri: 'https://example.com/',
        uriLength: 20,
        isSequential: false,
      }),
      hiddenSettings: none(),
    },
  });
});

test('it can create a candy machine using hidden settings', async (t) => {
  // Given an existing collection NFT.
  const umi = await createUmi();
  const collection = await createCollection(umi);

  // When we create a new candy machine with hidden settings.
  const candyMachine = generateSigner(umi);
  await transactionBuilder()
    .add(
      await createCandyMachineV2(umi, {
        candyMachine,
        mintType: MintType.CoreEdition,
        collection: collection.publicKey,
        collectionUpdateAuthority: umi.identity,
        itemsAvailable: 100,
        hiddenSettings: some({
          name: 'My NFT #$ID+1$',
          uri: 'https://example.com/$ID+1$.json',
          hash: new Uint8Array(Array(32).fill(42)),
        }),
      })
    )
    .sendAndConfirm(umi);

  // Then we expect the candy machine account to have the right data.
  const candyMachineAccount = await fetchCandyMachine(
    umi,
    candyMachine.publicKey
  );
  t.like(candyMachineAccount, <CandyMachine>{
    publicKey: publicKey(candyMachine),
    authority: publicKey(umi.identity),
    mintAuthority: publicKey(umi.identity),
    collectionMint: publicKey(collection),
    version: AccountVersion.V2,
    mintType: MintType.CoreEdition,
    itemsRedeemed: 0n,
    data: {
      itemsAvailable: 100n,
      maxEditionSupply: 0n,
      isMutable: true,
      configLineSettings: none(),
      hiddenSettings: some({
        name: 'My NFT #$ID+1$',
        uri: 'https://example.com/$ID+1$.json',
        hash: new Uint8Array(Array(32).fill(42)),
      }),
    },
  });
});

test('it cannot create a candy machine without hidden or config line settings', async (t) => {
  // Given an existing collection NFT.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;

  // When we try to create a new candy machine without any settings.
  const candyMachine = generateSigner(umi);
  const promise = transactionBuilder()
    .add(
      await createCandyMachineV2(umi, {
        ...defaultCandyMachineData(umi),
        mintType: MintType.Core,
        collection,
        candyMachine,
        configLineSettings: none(),
        hiddenSettings: none(),
      })
    )
    .sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { message: /A raw constraint was violated/ });
});

test('it can create a candy machine of Programmable NFTs', async (t) => {
  // Given an existing collection NFT.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;

  // When we create a new candy machine using the Programmable NFTs standard.
  const candyMachine = generateSigner(umi);
  await transactionBuilder()
    .add(
      await createCandyMachineV2(umi, {
        ...defaultCandyMachineData(umi),
        mintType: MintType.Core,
        candyMachine,
        collection,
      })
    )
    .sendAndConfirm(umi);

  // Then we expect the candy machine account to have the right data.
  const candyMachineAccount = await fetchCandyMachine(
    umi,
    candyMachine.publicKey
  );
  t.like(candyMachineAccount, <CandyMachine>{
    publicKey: publicKey(candyMachine),
    version: AccountVersion.V2,
  });
});

test("it can create a candy machine that's bigger than 10Kb", async (t) => {
  // Given an existing collection NFT.
  const umi = await createUmi();
  const collection = await createCollection(umi);

  // When we create a new candy machine with a large amount of items.
  const candyMachine = generateSigner(umi);
  await transactionBuilder()
    .add(
      await createCandyMachineV2(umi, {
        ...defaultCandyMachineData(umi),
        mintType: MintType.Core,
        candyMachine,
        itemsAvailable: 20000,
        collection: collection.publicKey,
      })
    )
    .sendAndConfirm(umi);

  // Then we expect the candy machine account to have been created.
  const candyMachineAccount = await fetchCandyMachine(
    umi,
    candyMachine.publicKey
  );
  t.like(candyMachineAccount, <CandyMachine>{
    publicKey: publicKey(candyMachine),
    itemsRedeemed: 0n,
    data: { itemsAvailable: 20000n },
  });
});
