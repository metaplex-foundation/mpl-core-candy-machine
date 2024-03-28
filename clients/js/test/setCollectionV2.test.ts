import {
  generateSigner,
  publicKey,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import test from 'ava';

import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox';
import {
  PluginType,
  revokeCollectionPluginAuthorityV1,
} from '@metaplex-foundation/mpl-core';
import {
  CandyMachine,
  fetchCandyMachine,
  mintAssetFromCandyMachine,
  setCollectionV2,
} from '../src';
import { createCollection, createUmi, createV2 } from './_setup';

test('it can update the collection of a candy machine v2', async (t) => {
  // Given a Candy Machine associated with Collection A.
  const umi = await createUmi();
  const collectionUpdateAuthorityA = generateSigner(umi);
  const collectionA = await createCollection(umi, {
    updateAuthority: collectionUpdateAuthorityA.publicKey,
  });
  const candyMachine = await createV2(umi, {
    collection: collectionA.publicKey,
    collectionUpdateAuthority: collectionUpdateAuthorityA,
  });

  // When we update its collection to Collection B.
  const collectionUpdateAuthorityB = generateSigner(umi);
  const collectionB = await createCollection(umi, {
    updateAuthority: collectionUpdateAuthorityB.publicKey,
  });

  await setCollectionV2(umi, {
    candyMachine: candyMachine.publicKey,
    collection: collectionA.publicKey,
    collectionUpdateAuthority: collectionUpdateAuthorityA.publicKey,
    newCollection: collectionB.publicKey,
    newCollectionUpdateAuthority: collectionUpdateAuthorityB,
  }).sendAndConfirm(umi);

  // Then the Candy Machine's collection was updated accordingly.
  const candyMachineAccount = await fetchCandyMachine(
    umi,
    candyMachine.publicKey
  );
  t.like(candyMachineAccount, <CandyMachine>{
    collectionMint: publicKey(collectionB.publicKey),
  });
});

test('it cannot update the collection of a candy machine when mint is in progress', async (t) => {
  // Given a Candy Machine associated with Collection A.
  const umi = await createUmi();
  const collectionUpdateAuthorityA = umi.identity;
  const collectionA = await createCollection(umi);
  const candyMachine = await createV2(umi, {
    collection: collectionA.publicKey,
    collectionUpdateAuthority: collectionUpdateAuthorityA,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
  });

  // And we mint an NFT from the candy machine.
  const mint = generateSigner(umi);
  const owner = generateSigner(umi).publicKey;
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 400000 }))
    .add(
      mintAssetFromCandyMachine(umi, {
        candyMachine: publicKey(candyMachine),
        mintAuthority: umi.identity,
        assetOwner: owner,
        asset: mint,
        collection: publicKey(collectionA),
      })
    )
    .sendAndConfirm(umi);

  // When we try to update its collection to Collection B.
  const collectionUpdateAuthorityB = generateSigner(umi);
  const collectionB = await createCollection(umi, {
    updateAuthority: collectionUpdateAuthorityB.publicKey,
  });
  const promise = setCollectionV2(umi, {
    candyMachine: candyMachine.publicKey,
    collection: collectionA.publicKey,
    collectionUpdateAuthority: collectionUpdateAuthorityA.publicKey,
    newCollection: collectionB.publicKey,
    newCollectionUpdateAuthority: collectionUpdateAuthorityB,
  }).sendAndConfirm(umi);

  // Then we expect a client error.
  await t.throwsAsync(promise, {
    name: 'NoChangingCollectionDuringMint',
  });
});

test.only('it can set the same collection of a candy machine when mint is in progress', async (t) => {
  // Given a Candy Machine associated with Collection A.
  const umi = await createUmi();
  const collectionUpdateAuthorityA = umi.identity;
  const collectionA = await createCollection(umi);
  const candyMachine = await createV2(umi, {
    collection: collectionA.publicKey,
    collectionUpdateAuthority: collectionUpdateAuthorityA,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
  });

  // And we mint an NFT from the candy machine.
  const mint = generateSigner(umi);
  const owner = generateSigner(umi).publicKey;
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 400000 }))
    .add(
      mintAssetFromCandyMachine(umi, {
        candyMachine: publicKey(candyMachine),
        mintAuthority: umi.identity,
        assetOwner: owner,
        asset: mint,
        collection: publicKey(collectionA),
      })
    )
    .sendAndConfirm(umi);

  // And we remove delegate authority from the collection.

  await revokeCollectionPluginAuthorityV1(umi, {
    collection: collectionA.publicKey,
    authority: collectionUpdateAuthorityA,
    pluginType: PluginType.UpdateDelegate,
  }).sendAndConfirm(umi);

  // When we set the same collection.
  await setCollectionV2(umi, {
    candyMachine: candyMachine.publicKey,
    collection: collectionA.publicKey,
    collectionUpdateAuthority: collectionUpdateAuthorityA.publicKey,
    newCollection: collectionA.publicKey,
    newCollectionUpdateAuthority: collectionUpdateAuthorityA,
  }).sendAndConfirm(umi);

  // Then the transaction suceeds and the Candy Machine collection is still the same.
  const candyMachineAccount = await fetchCandyMachine(
    umi,
    candyMachine.publicKey
  );
  t.like(candyMachineAccount, <CandyMachine>{
    collectionMint: publicKey(collectionA.publicKey),
  });
});
