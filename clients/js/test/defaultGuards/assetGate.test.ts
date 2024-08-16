import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox';
import {
  generateSigner,
  sol,
  some,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import test from 'ava';
import { transferV1 } from '@metaplex-foundation/mpl-core';
import { mintV1 } from '../../src';
import {
  assertBotTax,
  assertSuccessfulMint,
  createCollection,
  createUmi,
  createV2,
  createAsset,
} from '../_setup';

test('it allows minting when the payer owns an asset from a certain collection', async (t) => {
  // Given the identity owns an NFT from a certain collection.
  const umi = await createUmi();
  const requiredCollectionAuthority = generateSigner(umi);
  const { publicKey: requiredCollection } = await createCollection(umi, {
    updateAuthority: requiredCollectionAuthority.publicKey,
  });
  const nftToVerify = await createAsset(umi, {
    owner: umi.identity.publicKey,
    collection: requiredCollection,
    authority: requiredCollectionAuthority,
  });

  // And a loaded Candy Machine with an assetGate guard.
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      assetGate: some({ requiredCollection }),
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
          assetGate: some({ asset: nftToVerify.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then minting was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: umi.identity });
});

test('it allows minting even when the payer is different from the minter', async (t) => {
  // Given a separate minter that owns an NFT from a certain collection.
  const umi = await createUmi();
  const minter = generateSigner(umi);
  const requiredCollectionAuthority = generateSigner(umi);
  const { publicKey: requiredCollection } = await createCollection(umi, {
    updateAuthority: requiredCollectionAuthority.publicKey,
  });
  const nftToVerify = await createAsset(umi, {
    owner: minter.publicKey,
    collection: requiredCollection,
    authority: requiredCollectionAuthority,
  });

  // And a loaded Candy Machine with an assetGate guard.
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      assetGate: some({ requiredCollection }),
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
        minter,
        collection,
        mintArgs: {
          assetGate: some({ asset: nftToVerify.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then minting was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: minter });
});

test('it forbids minting when the payer does not own an NFT from a certain collection', async (t) => {
  // Given the identity owns an NFT from a certain collection.
  const umi = await createUmi();
  const requiredCollectionAuthority = generateSigner(umi);
  const { publicKey: requiredCollection } = await createCollection(umi, {
    updateAuthority: requiredCollectionAuthority.publicKey,
  });
  const { publicKey: nftToVerify } = await createAsset(umi, {
    owner: umi.identity.publicKey,
    collection: requiredCollection,
    authority: requiredCollectionAuthority,
  });

  // But sent their NFT to another wallet.
  const destination = generateSigner(umi).publicKey;
  await transactionBuilder()
    .add(
      transferV1(umi, {
        authority: umi.identity,
        newOwner: destination,
        asset: nftToVerify,
        collection: requiredCollection,
      })
    )
    .sendAndConfirm(umi);

  // And a loaded Candy Machine with an assetGate guard on that collection.
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      assetGate: some({ requiredCollection }),
    },
  });

  // When the payer tries to mint from it.
  const mint = generateSigner(umi);
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
        mintArgs: {
          assetGate: some({ asset: nftToVerify }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then we expect an error.
  await t.throwsAsync(promise, { message: /MissingNft/ });
});

test('it forbids minting when the payer tries to provide an NFT from the wrong collection', async (t) => {
  // Given the identity owns an NFT from a collection A.
  const umi = await createUmi();
  const requiredCollectionAuthorityA = generateSigner(umi);
  const { publicKey: requiredCollectionA } = await createCollection(umi, {
    updateAuthority: requiredCollectionAuthorityA.publicKey,
  });
  const { publicKey: nftToVerify } = await createAsset(umi, {
    owner: umi.identity.publicKey,
    collection: requiredCollectionA,
    authority: requiredCollectionAuthorityA,
  });

  // And a loaded Candy Machine with an assetGate guard on a Collection B.
  const requiredCollectionAuthorityB = generateSigner(umi);
  const { publicKey: requiredCollectionB } = await createCollection(umi, {
    updateAuthority: requiredCollectionAuthorityB.publicKey,
  });
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      assetGate: some({ requiredCollection: requiredCollectionB }),
    },
  });

  // When the identity tries to mint from it using its collection A NFT.
  const mint = generateSigner(umi);
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
        mintArgs: {
          assetGate: some({ asset: nftToVerify }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then we expect an error.
  // console.log(await umi.rpc.getTransaction((await promise).signature));
  await t.throwsAsync(promise, { message: /InvalidNftCollection/ });
});

test('it forbids minting when the payer tries to provide an NFT from an unverified collection', async (t) => {
  // Given a payer that owns an unverified NFT from a certain collection.
  const umi = await createUmi();
  const requiredCollectionAuthority = generateSigner(umi);
  const { publicKey: requiredCollection } = await createCollection(umi, {
    updateAuthority: requiredCollectionAuthority.publicKey,
  });
  const { publicKey: nftToVerify } = await createAsset(umi, {
    owner: umi.identity.publicKey,
  });

  // And a loaded Candy Machine with an assetGate guard.
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      assetGate: some({ requiredCollection }),
    },
  });

  // When the payer tries to mint from it using its unverified NFT.
  const mint = generateSigner(umi);
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
        mintArgs: {
          assetGate: some({ asset: nftToVerify }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then we expect an error.
  await t.throwsAsync(promise, { message: /InvalidNftCollection/ });
});

test('it charges a bot tax when trying to mint without owning the right NFT', async (t) => {
  // Given a loaded Candy Machine with an assetGate guard and a bot tax guard.
  const umi = await createUmi();
  const { publicKey: requiredCollection } = await createCollection(umi);
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: some({ lamports: sol(0.1), lastInstruction: true }),
      assetGate: some({ requiredCollection }),
    },
  });

  // When we try to mint from it using any NFT that's not from the required collection.
  const wrongNft = await createAsset(umi, {});
  const mint = generateSigner(umi);
  const { signature } = await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
        mintArgs: {
          assetGate: some({ asset: wrongNft.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then we expect a bot tax error.
  await assertBotTax(t, umi, mint, signature, /InvalidNftCollection/);
});
