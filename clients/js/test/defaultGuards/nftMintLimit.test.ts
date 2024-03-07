import {
  TokenStandard,
  transferV1,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  createIdempotentAssociatedToken,
  findAssociatedTokenPda,
  setComputeUnitLimit,
} from '@metaplex-foundation/mpl-toolbox';
import {
  generateSigner,
  none,
  sol,
  some,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import test from 'ava';
import {
  fetchNftMintCounter,
  findCandyGuardPda,
  findNftMintCounterPda,
  mintV2,
} from '../../src';
import {
  assertBotTax,
  assertSuccessfulMint,
  createCollectionNft,
  createCollection,
  createUmi,
  createV2,
  createVerifiedNft,
} from '../_setup';

test('it allows minting when the nft mint limit is not reached', async (t) => {
  // Given a loaded Candy Machine with a mint limit of 5.
  const umi = await createUmi();
  const requiredCollectionAuthority = generateSigner(umi);
  const { publicKey: requiredCollection } = await createCollectionNft(umi, {
    authority: requiredCollectionAuthority,
  });
  const nftToVerify = await createVerifiedNft(umi, {
    tokenOwner: umi.identity.publicKey,
    collectionMint: requiredCollection,
    collectionAuthority: requiredCollectionAuthority,
  });

  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      nftMintLimit: some({ id: 1, limit: 5, requiredCollection }),
    },
  });

  // When we mint from it.
  const mint = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV2(umi, {
        candyMachine,
        asset: mint,
        collection,
        mintArgs: {
          nftMintLimit: some({ id: 1, mint: nftToVerify.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then minting was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: umi.identity });

  // And the mint limit PDA was incremented.
  const counterPda = findNftMintCounterPda(umi, {
    id: 1,
    mint: nftToVerify.publicKey,
    candyGuard: findCandyGuardPda(umi, { base: candyMachine })[0],
    candyMachine,
  });
  const counterAccount = await fetchNftMintCounter(umi, counterPda);
  t.is(counterAccount.count, 1);
});

test('it allows minting even when the payer is different from the minter', async (t) => {
  // Given a loaded Candy Machine with a mint limit of 5.
  const umi = await createUmi();
  const requiredCollectionAuthority = generateSigner(umi);
  const minter = generateSigner(umi);
  const { publicKey: requiredCollection } = await createCollectionNft(umi, {
    authority: requiredCollectionAuthority,
  });
  const nftToVerify = await createVerifiedNft(umi, {
    tokenOwner: minter.publicKey,
    collectionMint: requiredCollection,
    collectionAuthority: requiredCollectionAuthority,
  });

  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      nftMintLimit: some({ id: 1, limit: 5, requiredCollection }),
    },
  });

  // When we mint from it using a separate minter.

  const mint = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV2(umi, {
        candyMachine,
        asset: mint,
        minter,
        collection,
        mintArgs: {
          nftMintLimit: some({ id: 1, mint: nftToVerify.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then minting was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: minter });

  // And the mint limit PDA was incremented for that minter.
  const counterPda = findNftMintCounterPda(umi, {
    id: 1,
    mint: nftToVerify.publicKey,
    candyMachine,
    candyGuard: findCandyGuardPda(umi, { base: candyMachine })[0],
  });
  const counterAccount = await fetchNftMintCounter(umi, counterPda);
  t.is(counterAccount.count, 1);
});

test('it forbids minting when the nft mint limit is reached', async (t) => {
  // Given a loaded Candy Machine with a mint limit of 1.
  const umi = await createUmi();
  const requiredCollectionAuthority = generateSigner(umi);
  const { publicKey: requiredCollection } = await createCollectionNft(umi, {
    authority: requiredCollectionAuthority,
  });
  const nftToVerify = await createVerifiedNft(umi, {
    tokenOwner: umi.identity.publicKey,
    collectionMint: requiredCollection,
    collectionAuthority: requiredCollectionAuthority,
  });

  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      nftMintLimit: some({ id: 42, limit: 1, requiredCollection }),
    },
  });

  // And the identity already minted their NFT.
  const mint = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV2(umi, {
        candyMachine,
        asset: mint,
        collection,
        mintArgs: {
          nftMintLimit: some({ id: 42, mint: nftToVerify.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);

  // When that same nft tries to mint from the same Candy Machine again.
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV2(umi, {
        candyMachine,
        asset: generateSigner(umi),
        collection,
        mintArgs: {
          nftMintLimit: some({ id: 42, mint: nftToVerify.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then we expect an error.
  await t.throwsAsync(promise, { message: /AllowedMintLimitReached/ });
});

test('it forbids minting when minter does not own nft', async (t) => {
  // Given a loaded Candy Machine with a mint limit of 1.
  const umi = await createUmi();
  const minterA = generateSigner(umi);
  const requiredCollectionAuthority = generateSigner(umi);
  const { publicKey: requiredCollection } = await createCollectionNft(umi, {
    authority: requiredCollectionAuthority,
  });
  const nftToVerify = await createVerifiedNft(umi, {
    tokenOwner: umi.identity.publicKey,
    collectionMint: requiredCollection,
    collectionAuthority: requiredCollectionAuthority,
  });

  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      nftMintLimit: some({ id: 42, limit: 1, requiredCollection }),
    },
  });

  // When that same nft tries to mint from the same Candy Machine again.
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV2(umi, {
        candyMachine,
        minter: minterA,
        asset: generateSigner(umi),
        collection,
        mintArgs: {
          nftMintLimit: some({ id: 42, mint: nftToVerify.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then we expect an error.
  await t.throwsAsync(promise, {
    message: /Account does not have correct owner/,
  });
});

test('it forbids minting when nft does not belong to the required collection', async (t) => {
  // Given a loaded Candy Machine with a mint limit of 1.
  const umi = await createUmi();
  const requiredCollectionAuthority = generateSigner(umi);
  const { publicKey: requiredCollection } = await createCollectionNft(umi, {
    authority: requiredCollectionAuthority,
  });
  const nftToVerify = await createVerifiedNft(umi, {
    tokenOwner: umi.identity.publicKey,
    collectionMint: requiredCollection,
    collectionAuthority: requiredCollectionAuthority,
  });

  const requiredCollectionAuthorityB = generateSigner(umi);
  const { publicKey: requiredCollectionB } = await createCollectionNft(umi, {
    authority: requiredCollectionAuthorityB,
  });
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      nftMintLimit: some({
        id: 42,
        limit: 1,
        requiredCollection: requiredCollectionB,
      }),
    },
  });

  // When that same nft tries to mint from the same Candy Machine again.
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV2(umi, {
        candyMachine,
        asset: generateSigner(umi),
        collection,
        mintArgs: {
          nftMintLimit: some({ id: 42, mint: nftToVerify.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then we expect an error.
  await t.throwsAsync(promise, { message: /InvalidNftCollection/ });
});

test('the mint limit is local to each nft', async (t) => {
  // Given a loaded Candy Machine with a mint limit of 1.
  const umi = await createUmi();
  const requiredCollectionAuthority = generateSigner(umi);
  const minterA = generateSigner(umi);

  const { publicKey: requiredCollection } = await createCollectionNft(umi, {
    authority: requiredCollectionAuthority,
  });
  const nftToVerify = await createVerifiedNft(umi, {
    tokenOwner: minterA.publicKey,
    collectionMint: requiredCollection,
    collectionAuthority: requiredCollectionAuthority,
  });

  const nftToVerify2 = await createVerifiedNft(umi, {
    tokenOwner: minterA.publicKey,
    collectionMint: requiredCollection,
    collectionAuthority: requiredCollectionAuthority,
  });

  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      nftMintLimit: some({ id: 42, limit: 1, requiredCollection }),
    },
  });

  // When minter A mints using their mint A.
  const mintA = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV2(umi, {
        candyMachine,
        asset: mintA,
        minter: minterA,
        collection,
        mintArgs: {
          nftMintLimit: some({ id: 42, mint: nftToVerify.publicKey }),
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
      mintV2(umi, {
        candyMachine,
        asset: mintB,
        minter: minterA,
        collection,
        mintArgs: {
          nftMintLimit: some({ id: 42, mint: nftToVerify2.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then minting was successful as the limit is per nft.
  await assertSuccessfulMint(t, umi, { mint: mintB, owner: minterA });
});

test('forbids minting with different owners using the same nft', async (t) => {
  // Given a loaded Candy Machine with a mint limit of 1.
  const umi = await createUmi();
  const minterA = generateSigner(umi);
  const requiredCollectionAuthority = generateSigner(umi);
  const { publicKey: requiredCollection } = await createCollectionNft(umi, {
    authority: requiredCollectionAuthority,
  });
  const nftToVerify = await createVerifiedNft(umi, {
    tokenOwner: minterA.publicKey,
    collectionMint: requiredCollection,
    collectionAuthority: requiredCollectionAuthority,
  });

  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      nftMintLimit: some({ id: 42, limit: 1, requiredCollection }),
    },
  });

  // When minter A mints using the mint NFT.
  const mintA = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV2(umi, {
        candyMachine,
        asset: mintA,
        minter: minterA,
        collection,
        mintArgs: {
          nftMintLimit: some({ id: 42, mint: nftToVerify.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);
  await assertSuccessfulMint(t, umi, { mint: mintA, owner: minterA });

  // Transfer the mint NFT to minter B.
  const minterB = generateSigner(umi);
  const [minterBATA] = findAssociatedTokenPda(umi, {
    mint: nftToVerify.publicKey,
    owner: minterB.publicKey,
  });

  await transactionBuilder()
    .add(
      createIdempotentAssociatedToken(umi, {
        ata: minterBATA,
        mint: nftToVerify.publicKey,
        owner: minterB.publicKey,
      })
    )
    .sendAndConfirm(umi);

  await transactionBuilder()
    .add(
      transferV1(umi, {
        mint: nftToVerify.publicKey,
        token: findAssociatedTokenPda(umi, {
          mint: nftToVerify.publicKey,
          owner: minterA.publicKey,
        }),
        tokenOwner: minterA.publicKey,
        destinationOwner: minterB.publicKey,
        payer: minterA,
        destinationToken: minterBATA,
        authority: minterA,
        amount: 1,
        authorizationData: none(),
        tokenStandard: TokenStandard.NonFungible,
      })
    )
    .sendAndConfirm(umi);

  // When minter B mints using the same mint NFT.
  const mintB = generateSigner(umi);
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV2(umi, {
        candyMachine,
        asset: mintB,
        minter: minterB,
        collection,
        mintArgs: {
          nftMintLimit: some({ id: 42, mint: nftToVerify.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);

  await t.throwsAsync(promise, { message: /AllowedMintLimitReached/ });
});

test('it charges a bot tax when trying to mint after the limit', async (t) => {
  // Given a loaded Candy Machine with a mint limit of 1 and a bot tax guard.
  const umi = await createUmi();
  const requiredCollectionAuthority = generateSigner(umi);
  const { publicKey: requiredCollection } = await createCollectionNft(umi, {
    authority: requiredCollectionAuthority,
  });
  const nftToVerify = await createVerifiedNft(umi, {
    tokenOwner: umi.identity.publicKey,
    collectionMint: requiredCollection,
    collectionAuthority: requiredCollectionAuthority,
  });

  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      botTax: some({ lamports: sol(0.1), lastInstruction: true }),
      nftMintLimit: some({ id: 42, limit: 1, requiredCollection }),
    },
  });

  // When the identity mints their NFT.
  const mintA = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV2(umi, {
        candyMachine,
        asset: mintA,
        collection,
        mintArgs: {
          nftMintLimit: some({ id: 42, mint: nftToVerify.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);

  // And the identity tries to mint from the same Candy Machine again.
  const mintB = generateSigner(umi);
  const { signature } = await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV2(umi, {
        candyMachine,
        asset: mintB,
        collection,
        mintArgs: {
          nftMintLimit: some({ id: 42, mint: nftToVerify.publicKey }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then we expect a bot tax error.
  await assertBotTax(t, umi, mintB, signature, /AllowedMintLimitReached/);
});
