import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox';
import {
  generateSigner,
  sol,
  some,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import test from 'ava';
import { generateSignerWithSol } from '@metaplex-foundation/umi-bundle-tests';
import { mintV1 } from '../../src';
import {
  assertBurnedAsset,
  assertSuccessfulMint,
  createAsset,
  createCollection,
  createUmi,
  createV2,
} from '../_setup';

test('it burns multiple assets to allow minting', async (t) => {
  const umi = await createUmi();
  const requiredCollection = (await createCollection(umi)).publicKey;

  const assets = await Promise.all(
    new Array(5)
      .fill(0)
      .map(() => createAsset(umi, { collection: requiredCollection }))
  );

  const collection = (await createCollection(umi)).publicKey;

  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      assetBurnMulti: some({ requiredCollection, num: 5 }),
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
          assetBurnMulti: some({
            requiredCollection,
            assets: assets.map((a) => a.publicKey),
          }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then minting was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: umi.identity });

  // And the Assets were burned.
  await Promise.all(assets.map((a) => assertBurnedAsset(t, umi, a)));
});

test('it fails to mint if not enough assets are burned', async (t) => {
  const umi = await createUmi();
  const requiredCollection = (await createCollection(umi)).publicKey;

  const assets = await Promise.all(
    new Array(3)
      .fill(0)
      .map(() => createAsset(umi, { collection: requiredCollection }))
  );

  const collection = (await createCollection(umi)).publicKey;

  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      assetBurnMulti: some({ requiredCollection, num: 5 }),
    },
  });

  // When the identity mints from it using its Asset to burn.
  const mint = generateSigner(umi);
  const res = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
        mintArgs: {
          assetBurnMulti: some({
            requiredCollection,
            assets: assets.map((a) => a.publicKey),
          }),
        },
      })
    )
    .sendAndConfirm(umi);

  await t.throwsAsync(res, { message: /MissingRemainingAccount./ });
});

test('if fails to mint if minter does not own the assets', async (t) => {
  const umi = await createUmi();
  const minter = await generateSignerWithSol(umi, sol(1));
  const requiredCollection = (await createCollection(umi)).publicKey;

  const assets = await Promise.all(
    new Array(3)
      .fill(0)
      .map(() => createAsset(umi, { collection: requiredCollection }))
  );

  const collection = (await createCollection(umi)).publicKey;

  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      assetBurnMulti: some({ requiredCollection, num: 5 }),
    },
  });

  // When the identity mints from it using its Asset to burn.
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
          assetBurnMulti: some({
            requiredCollection,
            assets: assets.map((a) => a.publicKey),
          }),
        },
      })
    )
    .sendAndConfirm(umi);

  await t.throwsAsync(res, { message: /IncorrectOwner/ });
});
