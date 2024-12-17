import {
  setComputeUnitLimit,
} from '@metaplex-foundation/mpl-toolbox';
import { generateSigner, publicKey, transactionBuilder } from '@metaplex-foundation/umi';
import test from 'ava';
import { AssetV1, fetchAssetV1 } from '@metaplex-foundation/mpl-core';
import {
  CandyMachine,
  fetchCandyMachine,
  findCandyMachineAuthorityPda,
  updateAssetFromCandyMachine,
} from '../src';
import {
  assertSuccessfulMint,
  createAsset,
  createCollection,
  createUmi,
  createV2,
} from './_setup';

test('it can update directly from a candy machine as the mint authority', async (t) => {
  // Given a loaded candy machine.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const candyMachineSigner = await createV2(umi, {
    collection,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      // { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
  });
  const candyMachine = candyMachineSigner.publicKey;

  // When we mint a new NFT directly from the candy machine as the mint authority.
  const owner = generateSigner(umi).publicKey;
  const authorityPda = findCandyMachineAuthorityPda(umi, { candyMachine: candyMachineSigner.publicKey });
  const mint = await createAsset(umi, {
    owner,
    plugins: [
      {
        plugin: {
          __kind: 'UpdateDelegate',
          fields: [{ additionalDelegates: [publicKey(authorityPda)] }],
        },
        authority: null,
      },
    ],
  });
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 400000 }))
    .add(
      updateAssetFromCandyMachine(umi, {
        candyMachine,
        mintAuthority: umi.identity,
        assetOwner: owner,
        asset: mint.publicKey,
        collection,
      })
    )
    .sendAndConfirm(umi);

  // Then the mint was successful.
  await assertSuccessfulMint(t, umi, { mint, owner });

  // And the candy machine was updated.
  const candyMachineAccount = await fetchCandyMachine(umi, candyMachine);
  t.like(candyMachineAccount, <CandyMachine>{ itemsRedeemed: 1n });

  // And the asset was updated.
  const assetAccount = await fetchAssetV1(umi, mint.publicKey);
  t.like(assetAccount, <AssetV1>{ name: 'Degen #1', uri: 'https://example.com/degen/1' });
});

test('it cannot update directly from a candy machine if we are not the mint authority', async (t) => {
  // Given a loaded candy machine with a mint authority A.
  const umi = await createUmi();
  const mintAuthorityA = generateSigner(umi);
  const collection = await createCollection(umi, {
    updateAuthority: mintAuthorityA.publicKey,
  });
  const candyMachineSigner = await createV2(umi, {
    authority: mintAuthorityA.publicKey,
    collection: collection.publicKey,
    collectionUpdateAuthority: mintAuthorityA,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
  });
  const candyMachine = candyMachineSigner.publicKey;

  // When we try to mint directly from the candy machine as mint authority B.
  const mintAuthorityB = generateSigner(umi);
  const authorityPda = findCandyMachineAuthorityPda(umi, { candyMachine: candyMachineSigner.publicKey });
  const owner = generateSigner(umi).publicKey;
  const mint = await createAsset(umi, {
    owner,
    plugins: [
      {
        plugin: {
          __kind: 'UpdateDelegate',
          fields: [{ additionalDelegates: [publicKey(authorityPda)] }],
        },
        authority: null,
      },
    ],
  });
  const promise = transactionBuilder()
    .add(
      updateAssetFromCandyMachine(umi, {
        candyMachine,
        mintAuthority: mintAuthorityB,
        asset: mint.publicKey,
        assetOwner: owner,
        collection: collection.publicKey,
      })
    )
    .sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, {
    message: /A has one constraint was violated/,
  });

  // And the candy machine stayed the same.
  const candyMachineAccount = await fetchCandyMachine(umi, candyMachine);
  t.like(candyMachineAccount, <CandyMachine>{ itemsRedeemed: 0n });
});
