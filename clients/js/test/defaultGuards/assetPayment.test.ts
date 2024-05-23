import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox';
import {
  generateSigner,
  publicKey,
  sol,
  some,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import test from 'ava';
import { fetchAssetV1 } from '@metaplex-foundation/mpl-core';
import { mintV1 } from '../../src';
import {
  assertBotTax,
  assertSuccessfulMint,
  createAsset,
  createAssetWithCollection,
  createCollection,
  createUmi,
  createV2,
} from '../_setup';

test('it transfers an Asset from the payer to the destination', async (t) => {
  // Given a loaded Candy Machine with an assetPayment guard on a required collection.
  const umi = await createUmi();
  const destination = generateSigner(umi).publicKey;

  const [assetToSend, requiredCollection] = await createAssetWithCollection(
    umi
  );

  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      assetPayment: some({
        requiredCollection: publicKey(requiredCollection),
        destination,
      }),
    },
  });

  // When the payer mints from it using its Asset to pay.
  const mint = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
        mintArgs: {
          assetPayment: some({
            requiredCollection: publicKey(requiredCollection),
            asset: assetToSend.publicKey,
            destination,
          }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then minting was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: umi.identity });

  // And the Asset now belongs to the Asset destination.
  const updatedAsset = await fetchAssetV1(umi, assetToSend.publicKey);
  t.deepEqual(updatedAsset.owner, destination);
});

test('it allows minting even when the payer is different from the minter', async (t) => {
  // Given a loaded Candy Machine with an assetPayment guard on a required collection.
  const umi = await createUmi();
  const destination = generateSigner(umi).publicKey;
  const requiredCollection = await createCollection(umi);

  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      assetPayment: some({
        requiredCollection: publicKey(requiredCollection),
        destination,
      }),
    },
  });

  // And given a separate minter owns an Asset from that collection.
  const minter = generateSigner(umi);
  const assetToSend = await createAsset(umi, {
    collection: requiredCollection.publicKey,
    owner: minter.publicKey,
  })

  // When the minter mints from it using its Asset to pay.
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
          assetPayment: some({
            requiredCollection: publicKey(requiredCollection),
            asset: assetToSend.publicKey,
            destination,
          }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then minting was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: minter });

  // And the Asset now belongs to the Asset destination.
  const updatedAsset = await fetchAssetV1(umi, assetToSend.publicKey);
  t.deepEqual(updatedAsset.owner, destination);
});

test('it fails if the payer does not own the right Asset', async (t) => {
  // Given a loaded Candy Machine with an assetPayment guard on a required collection.
  const umi = await createUmi();
  const destination = generateSigner(umi).publicKey;
  const [, requiredCollection] = await createAssetWithCollection(umi);
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      assetPayment: some({
        requiredCollection: publicKey(requiredCollection),
        destination,
      }),
    },
  });

  // And given the identity owns an Asset this is not from that collection.
  const wrongAsset = await createAsset(umi, {

  })

  // When the identity tries to mint from it using its Asset to pay.
  const mint = generateSigner(umi);
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
        mintArgs: {
          assetPayment: some({
            requiredCollection: publicKey(requiredCollection),
            asset: wrongAsset.publicKey,
            destination,
          }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then we expect an error.
  await t.throwsAsync(promise, { message: /InvalidNftCollection/ });
});

test('it charges a bot tax when trying to pay with the wrong Asset', async (t) => {
  // Given a loaded Candy Machine with an assetPayment guard on a required collection and a bot tax.
  const umi = await createUmi();
  const destination = generateSigner(umi).publicKey;
  const [, requiredCollection] = await createAssetWithCollection(umi);
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: some({ lamports: sol(0.1), lastInstruction: true }),
      assetPayment: some({
        requiredCollection: publicKey(requiredCollection),
        destination,
      }),
    },
  });

  // And given the identity owns an Asset this is not from that collection.
  const wrongAsset = await createAsset(umi, {

  })

  // When the identity tries to mint from it using its Asset to pay.
  const mint = generateSigner(umi);
  const { signature } = await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
        mintArgs: {
          assetPayment: some({
            requiredCollection: publicKey(requiredCollection),
            asset: wrongAsset.publicKey,
            destination,
          }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then we expect a bot tax error.
  await assertBotTax(t, umi, mint, signature, /InvalidNftCollection/);
});
