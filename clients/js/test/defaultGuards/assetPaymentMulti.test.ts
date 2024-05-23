import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox';
import {
  generateSigner,
  sol,
  some,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import test from 'ava';
import { generateSignerWithSol } from '@metaplex-foundation/umi-bundle-tests';
import { fetchAssetV1 } from '@metaplex-foundation/mpl-core';
import { mintV1 } from '../../src';
import {
  assertSuccessfulMint,
  createAsset,
  createCollection,
  createUmi,
  createV2,
} from '../_setup';

test('it pays multiple assets to allow minting', async (t) => {
  const umi = await createUmi();
  const requiredCollection = (await createCollection(umi)).publicKey;
  const destination = generateSigner(umi).publicKey;

  const assets = await Promise.all(new Array(5).fill(0).map(() => createAsset(umi, { collection: requiredCollection })));

  const collection = (await createCollection(umi)).publicKey;

  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      assetPaymentMulti: some({ requiredCollection, num: 5, destination }),
    },
  });

  // When the identity mints from it using its Asset to pay.
  const mint = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
        mintArgs: {
          assetPaymentMulti: some({
            requiredCollection,
            assets: assets.map((a) => a.publicKey),
            destination
          }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then minting was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: umi.identity });

  // And the Assets were payed.
  await Promise.all(assets.map(async (a) => {
    const asset = await fetchAssetV1(umi, a.publicKey)
    t.is(asset.owner, destination);
  }))
})

test('it fails to mint if not enough assets are paid', async (t) => {
  const umi = await createUmi();
  const requiredCollection = (await createCollection(umi)).publicKey;
  const destination = generateSigner(umi).publicKey;

  const assets = await Promise.all(new Array(3).fill(0).map(() => createAsset(umi, { collection: requiredCollection })));

  const collection = (await createCollection(umi)).publicKey;

  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      assetPaymentMulti: some({ requiredCollection, num: 5, destination }),
    },
  });

  // When the identity mints from it using its Asset to pay.
  const mint = generateSigner(umi);
  const res =  transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
        mintArgs: {
          assetPaymentMulti: some({
            requiredCollection,
            assets: assets.map((a) => a.publicKey),
            destination
          }),
        },
      })
    )
    .sendAndConfirm(umi);

    await t.throwsAsync(res, { message: /MissingRemainingAccount./ });
})

test('if fails to mint if minter does not own the assets to be paid', async (t) => {
  const umi = await createUmi();
  const minter = await generateSignerWithSol(umi, sol(1));
  const destination = generateSigner(umi).publicKey;
  const requiredCollection = (await createCollection(umi)).publicKey;

  const assets = await Promise.all(new Array(3).fill(0).map(() => createAsset(umi, { collection: requiredCollection })));

  const collection = (await createCollection(umi)).publicKey;

  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      assetPaymentMulti: some({ requiredCollection, num: 5, destination }),
    },
  });

  // When the identity mints from it using its Asset to pay.
  const mint = generateSigner(umi);
  const res = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
        minter,
        mintArgs: {
          assetPaymentMulti: some({
            requiredCollection,
            assets: assets.map((a) => a.publicKey),
            destination
          }),
        },
      })
    )
    .sendAndConfirm(umi);

    await t.throwsAsync(res, { message: /IncorrectOwner/ });
})