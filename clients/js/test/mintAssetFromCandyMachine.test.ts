import {
  // createMintWithAssociatedToken,
  setComputeUnitLimit,
} from '@metaplex-foundation/mpl-toolbox';
import { generateSigner, transactionBuilder } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  CandyMachine,
  fetchCandyMachine,
  mintAssetFromCandyMachine,
} from '../src';
import {
  assertSuccessfulMint,
  createCollection,
  createUmi,
  createV2,
} from './_setup';

test('it can mint directly from a candy machine as the mint authority', async (t) => {
  // Given a loaded candy machine.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const candyMachineSigner = await createV2(umi, {
    collection,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
  });
  const candyMachine = candyMachineSigner.publicKey;

  // When we mint a new NFT directly from the candy machine as the mint authority.
  const mint = generateSigner(umi);
  const owner = generateSigner(umi).publicKey;
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 400000 }))
    .add(
      mintAssetFromCandyMachine(umi, {
        candyMachine,
        mintAuthority: umi.identity,
        assetOwner: owner,
        asset: mint,
        collection,
      })
    )
    .sendAndConfirm(umi);

  // Then the mint was successful.
  await assertSuccessfulMint(t, umi, { mint, owner });

  // And the candy machine was updated.
  const candyMachineAccount = await fetchCandyMachine(umi, candyMachine);
  t.like(candyMachineAccount, <CandyMachine>{ itemsRedeemed: 1n });
});

test('it cannot mint directly from a candy machine if we are not the mint authority', async (t) => {
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
  const mint = generateSigner(umi);
  const owner = generateSigner(umi).publicKey;
  const promise = transactionBuilder()
    .add(
      mintAssetFromCandyMachine(umi, {
        candyMachine,
        mintAuthority: mintAuthorityB,
        asset: mint,
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
