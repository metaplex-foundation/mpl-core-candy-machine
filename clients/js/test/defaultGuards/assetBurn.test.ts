import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox';
import {
  generateSigner,
  publicKey,
  sol,
  some,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import test from 'ava';
import { TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import { generateSignerWithSol } from '@metaplex-foundation/umi-bundle-tests';
import { mintV1 } from '../../src';
import {
  assertBotTax,
  assertBurnedAsset,
  assertSuccessfulMint,
  createAsset,
  createAssetWithCollection,
  createCollection,
  createUmi,
  createV2,
} from '../_setup';

test('it burns a specific Asset to allow minting', async (t) => {
  // Given the identity owns an Asset from a certain collection.
  const umi = await createUmi();
  const [assetToBurn, requiredCollection] = await createAssetWithCollection(
    umi
  );

  // And a loaded Candy Machine with an assetBurn guard on that collection.
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      assetBurn: some({ requiredCollection: publicKey(requiredCollection) }),
    },
  });

  // When the identity mints from it using its Asset to burn.
  const mint = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
        mintArgs: {
          assetBurn: some({
            tokenStandard: TokenStandard.NonFungible,
            requiredCollection: publicKey(requiredCollection),
            asset: assetToBurn.publicKey,
          }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then minting was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: umi.identity });

  // And the Asset was burned.
  await assertBurnedAsset(t, umi, assetToBurn);
});

test('it allows minting even when the payer is different from the minter', async (t) => {
  // Given a separate minter owns an Asset from a certain collection.
  const umi = await createUmi();
  const minter = await generateSignerWithSol(umi);
  const [, requiredCollection] = await createAssetWithCollection(umi);

  const assetToBurn = await createAsset(umi, {
    collection: requiredCollection.publicKey,
    owner: minter.publicKey,
  })

  // And a loaded Candy Machine with an assetBurn guard on that collection.
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      assetBurn: some({ requiredCollection: publicKey(requiredCollection) }),
    },
  });

  // When the minter mints from it using its Asset to burn.
  const mint = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        minter,
        collection,
        mintArgs: {
          assetBurn: some({
            tokenStandard: TokenStandard.NonFungible,
            requiredCollection: publicKey(requiredCollection),
            asset: assetToBurn.publicKey,
          }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then minting was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: minter });

  // And the Asset was burned.
  await assertBurnedAsset(t, umi, assetToBurn);
});

test('it fails if there is not valid Asset to burn', async (t) => {
  // Given a loaded Candy Machine with an assetBurn guard on a specific collection.
  const umi = await createUmi();
  const [, requiredCollection] = await createAssetWithCollection(umi);
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      assetBurn: some({ requiredCollection: requiredCollection.publicKey }),
    },
  });

  // When we try to mint from it using an Asset that's not part of this collection.
  const wrongAsset = await createAsset(umi, {})

  const mint = generateSigner(umi);
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
        mintArgs: {
          assetBurn: some({
            tokenStandard: TokenStandard.NonFungible,
            requiredCollection: requiredCollection.publicKey,
            asset: wrongAsset.publicKey,
          }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then we expect an error.
  await t.throwsAsync(promise, { message: /InvalidNftCollection/ });
});

test('it charges a bot tax when trying to mint using the wrong Asset', async (t) => {
  // Given a loaded Candy Machine with a botTax guard and
  // an assetBurn guard on a specific collection.
  const umi = await createUmi();
  const [, requiredCollection] = await createAssetWithCollection(umi);
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: some({ lamports: sol(0.01), lastInstruction: true }),
      assetBurn: some({ requiredCollection: requiredCollection.publicKey }),
    },
  });

  // When we try to mint from it using an Asset that's not part of this collection.
  const wrongAsset = await createAsset(umi, {

  })

  const mint = generateSigner(umi);
  const { signature } = await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
        mintArgs: {
          assetBurn: some({
            tokenStandard: TokenStandard.NonFungible,
            requiredCollection: requiredCollection.publicKey,
            asset: wrongAsset.publicKey,
          }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then we expect a bot tax error.
  await assertBotTax(t, umi, mint, signature, /InvalidNftCollection/);
});
