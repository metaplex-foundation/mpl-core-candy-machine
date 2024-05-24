import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox';
import {
  generateSigner,
  sol,
  some,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import test from 'ava';

import { transferV1 } from '@metaplex-foundation/mpl-core';
import {
  fetchAssetMintCounter,
  findCandyGuardPda,
  findAssetMintCounterPda,
  mintV1,
} from '../../src';
import {
  assertBotTax,
  assertSuccessfulMint,
  createCollection,
  createUmi,
  createV2,
  createAssetWithCollection,
  createAsset,
} from '../_setup';

test('it allows minting when the asset mint limit is not reached', async (t) => {
  // Given a loaded Candy Machine with a mint limit of 5.
  const umi = await createUmi();
  const [assetToVerify, requiredCollection] = await createAssetWithCollection(
    umi
  );

  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      assetMintLimit: some({
        id: 1,
        limit: 5,
        requiredCollection: requiredCollection.publicKey,
      }),
    },
  });

  // When we mint from it.
  const mint = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
        mintArgs: {
          assetMintLimit: some({ id: 1, asset: assetToVerify.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then minting was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: umi.identity });

  // And the mint limit PDA was incremented.
  const counterPda = findAssetMintCounterPda(umi, {
    id: 1,
    asset: assetToVerify.publicKey,
    candyGuard: findCandyGuardPda(umi, { base: candyMachine })[0],
    candyMachine,
  });
  const counterAccount = await fetchAssetMintCounter(umi, counterPda);
  t.is(counterAccount.count, 1);
});

test('it allows minting even when the payer is different from the minter', async (t) => {
  // Given a loaded Candy Machine with a mint limit of 5.
  const umi = await createUmi();
  const minter = generateSigner(umi);
  const [, requiredCollection] = await createAssetWithCollection(umi);

  const assetToVerify = await createAsset(umi, {
    collection: requiredCollection.publicKey,
    owner: minter.publicKey,
  });

  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      assetMintLimit: some({
        id: 1,
        limit: 5,
        requiredCollection: requiredCollection.publicKey,
      }),
    },
  });

  // When we mint from it using a separate minter.

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
          assetMintLimit: some({ id: 1, asset: assetToVerify.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then minting was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: minter });

  // And the mint limit PDA was incremented for that minter.
  const counterPda = findAssetMintCounterPda(umi, {
    id: 1,
    asset: assetToVerify.publicKey,
    candyMachine,
    candyGuard: findCandyGuardPda(umi, { base: candyMachine })[0],
  });
  const counterAccount = await fetchAssetMintCounter(umi, counterPda);
  t.is(counterAccount.count, 1);
});

test('it forbids minting when the asset mint limit is reached', async (t) => {
  // Given a loaded Candy Machine with a mint limit of 1.
  const umi = await createUmi();
  const [assetToVerify, requiredCollection] = await createAssetWithCollection(
    umi
  );

  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      assetMintLimit: some({
        id: 42,
        limit: 1,
        requiredCollection: requiredCollection.publicKey,
      }),
    },
  });

  // And the identity already minted their NFT.
  const mint = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
        mintArgs: {
          assetMintLimit: some({ id: 42, asset: assetToVerify.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);

  // When that same asset tries to mint from the same Candy Machine again.
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: generateSigner(umi),
        collection,
        mintArgs: {
          assetMintLimit: some({ id: 42, asset: assetToVerify.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then we expect an error.
  await t.throwsAsync(promise, { message: /AllowedMintLimitReached/ });
});

test('it forbids minting when minter does not own asset', async (t) => {
  // Given a loaded Candy Machine with a mint limit of 1.
  const umi = await createUmi();
  const minterA = generateSigner(umi);
  const [assetToVerify, requiredCollection] = await createAssetWithCollection(
    umi
  );

  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      assetMintLimit: some({
        id: 42,
        limit: 1,
        requiredCollection: requiredCollection.publicKey,
      }),
    },
  });

  // When that same asset tries to mint from the same Candy Machine again.
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        minter: minterA,
        asset: generateSigner(umi),
        collection,
        mintArgs: {
          assetMintLimit: some({ id: 42, asset: assetToVerify.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then we expect an error.
  await t.throwsAsync(promise, {
    message: /Account does not have correct owner/,
  });
});

test('it forbids minting when asset does not belong to the required collection', async (t) => {
  // Given a loaded Candy Machine with a mint limit of 1.
  const umi = await createUmi();
  const [assetToVerify] = await createAssetWithCollection(umi);

  const [, requiredCollectionB] = await createAssetWithCollection(umi);

  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      assetMintLimit: some({
        id: 42,
        limit: 1,
        requiredCollection: requiredCollectionB.publicKey,
      }),
    },
  });

  // When that same asset tries to mint from the same Candy Machine again.
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: generateSigner(umi),
        collection,
        mintArgs: {
          assetMintLimit: some({ id: 42, asset: assetToVerify.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then we expect an error.
  await t.throwsAsync(promise, { message: /InvalidNftCollection./ });
});

test('the mint limit is local to each asset', async (t) => {
  // Given a loaded Candy Machine with a mint limit of 1.
  const umi = await createUmi();

  const minterA = generateSigner(umi);
  const requiredCollection = (await createCollection(umi)).publicKey;

  const assetToVerify = await createAsset(umi, {
    collection: requiredCollection,
    owner: minterA.publicKey,
  });

  const assetToVerify2 = await createAsset(umi, {
    collection: requiredCollection,
    owner: minterA.publicKey,
  });

  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      assetMintLimit: some({ id: 42, limit: 1, requiredCollection }),
    },
  });

  // When minter A mints using their mint A.
  const mintA = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mintA,
        minter: minterA,
        collection,
        mintArgs: {
          assetMintLimit: some({ id: 42, asset: assetToVerify.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);
  await assertSuccessfulMint(t, umi, { mint: mintA, owner: minterA });

  // When minter A mints from the same Candy Machine with a different eligible NFT (mint B).
  const mintB = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mintB,
        minter: minterA,
        collection,
        mintArgs: {
          assetMintLimit: some({ id: 42, asset: assetToVerify2.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then minting was successful as the limit is per asset.
  await assertSuccessfulMint(t, umi, { mint: mintB, owner: minterA });
});

test('forbids minting with different owners using the same asset', async (t) => {
  // Given a loaded Candy Machine with a mint limit of 1.
  const umi = await createUmi();
  const minterA = generateSigner(umi);
  const [, requiredCollection] = await createAssetWithCollection(umi);

  const assetToVerify = await createAsset(umi, {
    collection: requiredCollection.publicKey,
    owner: minterA.publicKey,
  });

  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      assetMintLimit: some({
        id: 42,
        limit: 1,
        requiredCollection: requiredCollection.publicKey,
      }),
    },
  });

  // When minter A mints using the mint NFT.
  const mintA = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mintA,
        minter: minterA,
        collection,
        mintArgs: {
          assetMintLimit: some({ id: 42, asset: assetToVerify.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);
  await assertSuccessfulMint(t, umi, { mint: mintA, owner: minterA });

  // Transfer the mint NFT to minter B.
  const minterB = generateSigner(umi);

  await transferV1(umi, {
    asset: assetToVerify.publicKey,
    collection: requiredCollection.publicKey,
    authority: minterA,
    newOwner: minterB.publicKey,
  }).sendAndConfirm(umi);

  // When minter B mints using the same mint NFT.
  const mintB = generateSigner(umi);
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mintB,
        minter: minterB,
        collection,
        mintArgs: {
          assetMintLimit: some({ id: 42, asset: assetToVerify.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);

  await t.throwsAsync(promise, { message: /AllowedMintLimitReached/ });
});

test('it charges a bot tax when trying to mint after the limit', async (t) => {
  // Given a loaded Candy Machine with a mint limit of 1 and a bot tax guard.
  const umi = await createUmi();
  const [assetToVerify, requiredCollection] = await createAssetWithCollection(
    umi
  );

  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      botTax: some({ lamports: sol(0.1), lastInstruction: true }),
      assetMintLimit: some({
        id: 42,
        limit: 1,
        requiredCollection: requiredCollection.publicKey,
      }),
    },
  });

  // When the identity mints their NFT.
  const mintA = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mintA,
        collection,
        mintArgs: {
          assetMintLimit: some({ id: 42, asset: assetToVerify.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);

  // And the identity tries to mint from the same Candy Machine again.
  const mintB = generateSigner(umi);
  const { signature } = await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mintB,
        collection,
        mintArgs: {
          assetMintLimit: some({ id: 42, asset: assetToVerify.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then we expect a bot tax error.
  await assertBotTax(t, umi, mintB, signature, /AllowedMintLimitReached/);
});
