import {
  findAssociatedTokenPda,
  setComputeUnitLimit,
} from '@metaplex-foundation/mpl-toolbox';

import {
  generateSigner,
  isEqualToAmount,
  isSome,
  none,
  publicKey,
  PublicKey,
  Signer,
  sol,
  some,
  subtractAmounts,
  transactionBuilder,
  Umi,
} from '@metaplex-foundation/umi';
import { generateSignerWithSol } from '@metaplex-foundation/umi-bundle-tests';
import test, { Assertions } from 'ava';
import { AssetV1, fetchAssetV1 } from '@metaplex-foundation/mpl-core';
import {
  fetchFreezeEscrow,
  findCandyGuardPda,
  findFreezeEscrowPda,
  FreezeEscrow,
  mintV1,
  route,
} from '../../src';
import {
  assertBotTax,
  assertSuccessfulMint,
  createCollection,
  createUmi,
  createV2,
  isFrozen,
  METAPLEX_DEFAULT_RULESET,
} from '../_setup';

test('it transfers SOL to an escrow account and freezes the NFT', async (t) => {
  // Given a loaded Candy Machine with a freezeSolPayment guard.
  const umi = await createUmi();
  const destination = generateSigner(umi).publicKey;
  const identityBalance = await umi.rpc.getBalance(umi.identity.publicKey);
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      freezeSolPayment: some({ lamports: sol(1), destination }),
    },
  });

  // And given the freezeSolPayment guard is initialized.
  await transactionBuilder()
    .add(
      route(umi, {
        candyMachine,
        guard: 'freezeSolPayment',
        routeArgs: {
          path: 'initialize',
          period: 15 * 24 * 3600, // 15 days.
          candyGuardAuthority: umi.identity,
          destination,
        },
      })
    )
    .sendAndConfirm(umi);

  // When we mint from that candy machine.
  const mint = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
        mintArgs: { freezeSolPayment: some({ destination }) },
      })
    )
    .sendAndConfirm(umi);

  // Then minting was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: umi.identity });

  // And the NFT is frozen.
  const asset = await fetchAssetV1(umi, mint.publicKey);
  t.is(isFrozen(asset), true, 'NFT is frozen');

  // And cannot be thawed since not all NFTs have been minted.
  const promise = thawNft(
    umi,
    candyMachine,
    destination,
    mint.publicKey,
    collection
  );
  await t.throwsAsync(promise, { message: /ThawNotEnabled/ });

  // And the treasury escrow received SOLs.
  const [treasuryEscrow] = getFreezeEscrow(umi, candyMachine, destination);
  const treasuryEscrowBalance = await umi.rpc.getBalance(treasuryEscrow);
  t.true(
    isEqualToAmount(treasuryEscrowBalance, sol(1), sol(0.1)),
    'treasury escrow received SOLs'
  );

  // And was assigned the right data.
  const freezeEscrowAccount = await fetchFreezeEscrow(umi, treasuryEscrow);
  t.true(isSome(freezeEscrowAccount.firstMintTime));
  t.like(freezeEscrowAccount, <FreezeEscrow>{
    candyMachine: publicKey(candyMachine),
    candyGuard: publicKey(findCandyGuardPda(umi, { base: candyMachine })),
    frozenCount: 1n,
    freezePeriod: BigInt(15 * 24 * 3600),
    destination: publicKey(destination),
    authority: publicKey(umi.identity),
  });

  // And the payer lost SOLs.
  const newIdentityBalance = await umi.rpc.getBalance(umi.identity.publicKey);
  t.true(
    isEqualToAmount(
      newIdentityBalance,
      subtractAmounts(identityBalance, sol(1)),
      sol(0.1)
    )
  );
});

test('it allows minting even when the payer is different from the minter', async (t) => {
  // Given a loaded Candy Machine with a freezeSolPayment guard.
  const umi = await createUmi();
  const destination = generateSigner(umi).publicKey;
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      freezeSolPayment: some({ lamports: sol(1), destination }),
    },
  });

  // And given the freezeSolPayment guard is initialized.
  await initFreezeEscrow(umi, candyMachine, destination);

  // When we mint from that candy machine using an explicit minter.
  const mint = generateSigner(umi);
  const minter = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        minter,
        collection,
        mintArgs: { freezeSolPayment: some({ destination }) },
      })
    )
    .sendAndConfirm(umi);

  // Then minting was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: minter });
});

test('it can thaw an NFT once all NFTs are minted', async (t) => {
  // Given a loaded Candy Machine with an initialized
  // freezeSolPayment guard with only one item.
  const umi = await createUmi();
  const destination = generateSigner(umi).publicKey;
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      freezeSolPayment: some({ lamports: sol(1), destination }),
    },
  });
  await initFreezeEscrow(umi, candyMachine, destination);

  // And given we minted the only frozen NFT from that candy machine.
  const mint = await mintNft(umi, candyMachine, destination, collection);
  let asset = await fetchAssetV1(umi, mint.publicKey);
  t.is(isFrozen(asset), true, 'NFT is frozen');

  // When we thaw the NFT.
  await thawNft(umi, candyMachine, destination, mint.publicKey, collection);

  // Then the NFT is thawed.
  asset = await fetchAssetV1(umi, mint.publicKey);
  t.is(isFrozen(asset), false, 'NFT is thawed');
});

test('it can unlock funds once all NFTs have been thawed', async (t) => {
  // Given a loaded Candy Machine with an initialized freezeSolPayment guard.
  const umi = await createUmi();
  const destination = generateSigner(umi).publicKey;
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      freezeSolPayment: some({ lamports: sol(1), destination }),
    },
  });
  await initFreezeEscrow(umi, candyMachine, destination);

  // And given all NFTs have been minted and thawed.
  const mint = await mintNft(umi, candyMachine, destination, collection);
  await thawNft(umi, candyMachine, destination, mint.publicKey, collection);

  // When the authority unlocks the funds.
  await transactionBuilder()
    .add(
      route(umi, {
        candyMachine,
        guard: 'freezeSolPayment',
        routeArgs: {
          path: 'unlockFunds',
          candyGuardAuthority: umi.identity,
          destination,
        },
      })
    )
    .sendAndConfirm(umi);

  // Then the destination wallet received the funds.
  const treasuryBalance = await umi.rpc.getBalance(destination);
  t.true(
    isEqualToAmount(treasuryBalance, sol(1), sol(0.1)),
    'treasury received SOLs'
  );

  // And the treasury escrow has been emptied.
  const [treasuryEscrow] = getFreezeEscrow(umi, candyMachine, destination);
  const treasuryEscrowBalance = await umi.rpc.getBalance(treasuryEscrow);
  t.true(
    isEqualToAmount(treasuryEscrowBalance, sol(0)),
    'treasury escrow received SOLs'
  );
});

test('it cannot unlock funds if not all NFTs have been thawed', async (t) => {
  // Given a loaded Candy Machine with an initialized freezeSolPayment guard.
  const umi = await createUmi();
  const destination = generateSigner(umi).publicKey;
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      freezeSolPayment: some({ lamports: sol(1), destination }),
    },
  });
  await initFreezeEscrow(umi, candyMachine, destination);

  // And given all NFTs have been minted but not thawed.
  await mintNft(umi, candyMachine, destination, collection);

  // When the authority tries to unlock the funds.
  const promise = transactionBuilder()
    .add(
      route(umi, {
        candyMachine,
        guard: 'freezeSolPayment',
        routeArgs: {
          path: 'unlockFunds',
          candyGuardAuthority: umi.identity,
          destination,
        },
      })
    )
    .sendAndConfirm(umi);

  // Then we expect an error.
  await t.throwsAsync(promise, { message: /UnlockNotEnabled/ });

  // And the destination wallet did not receive any funds.
  const treasuryBalance = await umi.rpc.getBalance(destination);
  t.true(isEqualToAmount(treasuryBalance, sol(0)), 'treasury received no SOLs');
});

test('it can have multiple freeze escrow and reuse the same ones', async (t) => {
  // Increase the timeout of this long test to 20 seconds.
  t.timeout(20_000);

  // Given a loaded Candy Machine with 4 groups
  // containing freezeSolPayment guards such that:
  // - Group A and Group B use the same destination (and thus freeze escrow).
  // - Group C uses a different destination than group A and B.
  // - Group D does not use a freezeSolPayment guard at all.
  const umi = await createUmi();
  const identityBalance = await umi.rpc.getBalance(umi.identity.publicKey);
  const destinationAB = generateSigner(umi).publicKey;
  const destinationC = generateSigner(umi).publicKey;
  const destinationD = generateSigner(umi).publicKey;
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
      { name: 'Degen #3', uri: 'https://example.com/degen/3' },
      { name: 'Degen #4', uri: 'https://example.com/degen/4' },
    ],
    guards: {},
    groups: [
      {
        label: 'GROUPA',
        guards: {
          freezeSolPayment: some({
            lamports: sol(0.5),
            destination: destinationAB,
          }),
        },
      },
      {
        label: 'GROUPB',
        guards: {
          freezeSolPayment: some({
            lamports: sol(1),
            destination: destinationAB,
          }),
        },
      },
      {
        label: 'GROUPC',
        guards: {
          freezeSolPayment: some({
            lamports: sol(2),
            destination: destinationC,
          }),
        },
      },
      {
        label: 'GROUPD',
        guards: {
          solPayment: some({ lamports: sol(3), destination: destinationD }),
        },
      },
    ],
  });

  // And given all freeze escrows have been initialized.
  await initFreezeEscrow(umi, candyMachine, destinationAB, 'GROUPA');
  await initFreezeEscrow(umi, candyMachine, destinationC, 'GROUPC');

  // Note that trying to initialize the escrow for group B will fail
  // because it has already been initialized via group A.
  await t.throwsAsync(
    initFreezeEscrow(umi, candyMachine, destinationAB, 'GROUPB'),
    { message: /The freeze escrow account already exists/ }
  );

  // When we mint all 4 NFTs via each group.
  const cm = candyMachine;
  const mintA = await mintNft(umi, cm, destinationAB, collection, 'GROUPA'); // 0.5 SOL
  const mintB = await mintNft(umi, cm, destinationAB, collection, 'GROUPB'); // 1 SOL
  const mintC = await mintNft(umi, cm, destinationC, collection, 'GROUPC'); // 2 SOL
  const mintD = generateSigner(umi); // 3 SOL
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mintD,
        collection,
        group: some('GROUPD'),
        mintArgs: {
          solPayment: some({ destination: destinationD }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then all NFTs except for group D have been frozen.
  const [tokenA, tokenB, tokenC, tokenD] = await Promise.all(
    [mintA, mintB, mintC, mintD].map(
      ({ publicKey: mint }): Promise<AssetV1> => fetchAssetV1(umi, mint)
    )
  );

  t.is(isFrozen(tokenA), true, 'NFT A is frozen');
  t.is(isFrozen(tokenB), true, 'NFT B is frozen');
  t.is(isFrozen(tokenC), true, 'NFT C is frozen');
  t.is(isFrozen(tokenD), false, 'NFT D is not frozen');

  // And the treasury escrow received SOLs.
  const [treasuryEscrowAB] = getFreezeEscrow(umi, candyMachine, destinationAB);
  const [treasuryEscrowC] = getFreezeEscrow(umi, candyMachine, destinationC);
  const treasuryEscrowBalanceAB = await umi.rpc.getBalance(treasuryEscrowAB);
  const treasuryEscrowBalanceC = await umi.rpc.getBalance(treasuryEscrowC);
  t.true(
    isEqualToAmount(treasuryEscrowBalanceAB, sol(1.5), sol(0.1)),
    'treasury AB escrow received SOLs'
  );
  t.true(
    isEqualToAmount(treasuryEscrowBalanceC, sol(2), sol(0.1)),
    'treasury C escrow received SOLs'
  );

  // And the identity lost SOLs.
  const newIdentityBalance = await umi.rpc.getBalance(umi.identity.publicKey);
  t.true(
    isEqualToAmount(
      newIdentityBalance,
      subtractAmounts(identityBalance, sol(6.5)),
      sol(0.2)
    ),
    'identity lost SOLs'
  );

  // And the frozen counters securely decrease as we thaw all frozen NFTs.
  const assertFrozenCounts = async (ab: number, c: number) => {
    await Promise.all([
      assertFrozenCount(t, umi, candyMachine, destinationAB, ab),
      assertFrozenCount(t, umi, candyMachine, destinationC, c),
    ]);
  };
  await assertFrozenCounts(2, 1);
  await thawNft(umi, cm, destinationAB, mintD.publicKey, collection, 'GROUPA'); // Not frozen.
  await assertFrozenCounts(2, 1); // No change.
  await thawNft(umi, cm, destinationAB, mintA.publicKey, collection, 'GROUPA');
  await assertFrozenCounts(1, 1); // AB decreased.
  await thawNft(umi, cm, destinationAB, mintA.publicKey, collection, 'GROUPA'); // Already thawed.
  await assertFrozenCounts(1, 1); // No change.
  await thawNft(umi, cm, destinationAB, mintB.publicKey, collection, 'GROUPB');
  await assertFrozenCounts(0, 1); // AB decreased.
  await thawNft(umi, cm, destinationC, mintC.publicKey, collection, 'GROUPC');
  await assertFrozenCounts(0, 0); // C decreased.

  // And when the authority unlocks the funds of both freeze escrows.
  await unlockFunds(umi, cm, destinationAB, 'GROUPA');
  await unlockFunds(umi, cm, destinationC, 'GROUPC');

  // Note that trying to unlock the funds of group B will fail
  // because it has already been unlocked via group A.
  await t.throwsAsync(unlockFunds(umi, candyMachine, destinationAB, 'GROUPB'), {
    message: /AccountNotInitialized/,
  });

  // Then the treasuries received the funds.
  const [treasuryBalanceAB, treasuryBalanceC, treasuryBalanceD] =
    await Promise.all([
      umi.rpc.getBalance(destinationAB),
      umi.rpc.getBalance(destinationC),
      umi.rpc.getBalance(destinationD),
    ]);
  t.true(
    isEqualToAmount(treasuryBalanceAB, sol(1.5), sol(0.1)),
    'treasury AB received the funds'
  );
  t.true(
    isEqualToAmount(treasuryBalanceC, sol(2), sol(0.1)),
    'treasury C  received the funds'
  );
  t.true(
    isEqualToAmount(treasuryBalanceD, sol(3), sol(0.1)),
    'treasury D  received the funds'
  );

  // And the treasury escrows are empty.
  const [newEscrowBalanceAB, newEscrowBalanceC] = await Promise.all([
    umi.rpc.getBalance(treasuryEscrowAB),
    await umi.rpc.getBalance(treasuryEscrowC),
  ]);
  t.true(
    isEqualToAmount(newEscrowBalanceAB, sol(0)),
    'treasury AB escrow is empty'
  );
  t.true(
    isEqualToAmount(newEscrowBalanceC, sol(0)),
    'treasury C escrow is empty'
  );
});

test('it fails to mint if the freeze escrow was not initialized', async (t) => {
  // Given a loaded Candy Machine with a freezeSolPayment guard.
  const umi = await createUmi();
  const destination = generateSigner(umi).publicKey;
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      freezeSolPayment: some({ lamports: sol(1), destination }),
    },
  });

  // When we try to mint without initializing the freeze escrow.
  const mint = generateSigner(umi);
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
        mintArgs: { freezeSolPayment: some({ destination }) },
      })
    )
    .sendAndConfirm(umi);

  // Then we expect an error.
  await t.throwsAsync(promise, { message: /FreezeNotInitialized/ });
});

test('it fails to mint if the payer does not have enough funds', async (t) => {
  // Given a loaded Candy Machine with an initialized
  // freezeSolPayment guard costing 5 SOLs.
  const umi = await createUmi();
  const destination = generateSigner(umi).publicKey;
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      freezeSolPayment: some({ lamports: sol(5), destination }),
    },
  });
  await initFreezeEscrow(umi, candyMachine, destination);

  // When we mint from it using a payer that only has 4 SOL.
  const payer = await generateSignerWithSol(umi, sol(4));
  const mint = generateSigner(umi);
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        payer,
        minter: payer,
        collection,
        mintArgs: { freezeSolPayment: some({ destination }) },
      })
    )
    .sendAndConfirm(umi);

  // Then we expect an error.
  await t.throwsAsync(promise, { message: /NotEnoughSOL/ });

  // And the payer didn't loose any SOL.
  const payerBalance = await umi.rpc.getBalance(payer.publicKey);
  t.true(isEqualToAmount(payerBalance, sol(4)), 'payer did not lose SOLs');
});

test('it charges a bot tax if something goes wrong', async (t) => {
  // Given a loaded Candy Machine with a freezeSolPayment guard and a botTax guard.
  const umi = await createUmi();
  const destination = generateSigner(umi).publicKey;
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: some({ lamports: sol(0.1), lastInstruction: true }),
      freezeSolPayment: some({ lamports: sol(1), destination }),
    },
  });

  // When we try to mint without initializing the freeze escrow.
  const mint = generateSigner(umi);
  const { signature } = await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
        mintArgs: { freezeSolPayment: some({ destination }) },
      })
    )
    .sendAndConfirm(umi);

  // Then we expect a bot tax error.
  await assertBotTax(t, umi, mint, signature, /FreezeNotInitialized/);
});

test('it transfers SOL to an escrow account and locks the Programmable NFT', async (t) => {
  // Given a loaded Candy Machine with a freezeSolPayment guard.
  const umi = await createUmi();
  const destination = generateSigner(umi).publicKey;
  const identityBalance = await umi.rpc.getBalance(umi.identity.publicKey);
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      freezeSolPayment: some({ lamports: sol(1), destination }),
    },
  });

  // And given the freezeSolPayment guard is initialized.
  await initFreezeEscrow(umi, candyMachine, destination);

  // When we mint from that candy machine.
  const mint = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 800_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
        mintArgs: {
          freezeSolPayment: some({
            destination,
            nftRuleSet: METAPLEX_DEFAULT_RULESET,
          }),
        },
      })
    )
    .sendAndConfirm(umi);

  // Then minting was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: umi.identity });

  // And the pNFT is frozen.
  const asset = await fetchAssetV1(umi, mint.publicKey);
  t.is(isFrozen(asset), true);

  // And cannot be thawed since not all NFTs have been minted.
  const promise = thawNft(
    umi,
    candyMachine,
    destination,
    mint.publicKey,
    collection
  );
  await t.throwsAsync(promise, { message: /ThawNotEnabled/ });

  // And the treasury escrow received SOLs.
  const [treasuryEscrow] = getFreezeEscrow(umi, candyMachine, destination);
  const treasuryEscrowBalance = await umi.rpc.getBalance(treasuryEscrow);
  t.true(
    isEqualToAmount(treasuryEscrowBalance, sol(1), sol(0.1)),
    'treasury escrow received SOLs'
  );

  // And was assigned the right data.
  const freezeEscrowAccount = await fetchFreezeEscrow(umi, treasuryEscrow);
  t.true(isSome(freezeEscrowAccount.firstMintTime));
  t.like(freezeEscrowAccount, <FreezeEscrow>{
    candyMachine: publicKey(candyMachine),
    candyGuard: publicKey(findCandyGuardPda(umi, { base: candyMachine })),
    frozenCount: 1n,
    freezePeriod: BigInt(15 * 24 * 3600),
    destination: publicKey(destination),
    authority: publicKey(umi.identity),
  });

  // And the payer lost SOLs.
  const newIdentityBalance = await umi.rpc.getBalance(umi.identity.publicKey);
  t.true(
    isEqualToAmount(
      newIdentityBalance,
      subtractAmounts(identityBalance, sol(1)),
      sol(0.1)
    )
  );
});

test('it can thaw a Programmable NFT once all NFTs are minted', async (t) => {
  // Given a loaded Candy Machine with a ruleSet and an initialized
  // freezeSolPayment guard with only one item.
  const umi = await createUmi();
  const destination = generateSigner(umi).publicKey;
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      freezeSolPayment: some({ lamports: sol(1), destination }),
    },
  });
  await initFreezeEscrow(umi, candyMachine, destination);

  // And given we minted the only PNFT from that candy machine.
  const mint = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 800_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
        mintArgs: {
          freezeSolPayment: some({
            destination,
            nftRuleSet: METAPLEX_DEFAULT_RULESET,
          }),
        },
      })
    )
    .sendAndConfirm(umi);

  let asset = await fetchAssetV1(umi, mint.publicKey);
  t.is(isFrozen(asset), true, 'asset is frozen');

  // When we thaw the locked asset.
  await setComputeUnitLimit(umi, { units: 600_000 })
    .add(
      route(umi, {
        candyMachine,
        guard: 'freezeSolPayment',
        routeArgs: {
          path: 'thaw',
          asset: mint.publicKey,
          collection,
          destination,
        },
      })
    )
    .sendAndConfirm(umi);

  // Then the asset is unlocked.
  asset = await fetchAssetV1(umi, mint.publicKey);
  t.is(isFrozen(asset), false, 'asset is frozen');

  // And the freeze escrow ATA account is closed.
  t.false(
    await umi.rpc.accountExists(
      findAssociatedTokenPda(umi, {
        mint: mint.publicKey,
        owner: findFreezeEscrowPda(umi, {
          destination,
          candyMachine,
          candyGuard: findCandyGuardPda(umi, { base: candyMachine })[0],
        })[0],
      })[0]
    )
  );
});

const getFreezeEscrow = (
  umi: Umi,
  candyMachine: PublicKey,
  destination: Signer | PublicKey
) =>
  findFreezeEscrowPda(umi, {
    candyMachine,
    candyGuard: findCandyGuardPda(umi, { base: candyMachine })[0],
    destination: publicKey(destination),
  });

const getFrozenCount = async (
  umi: Umi,
  candyMachine: PublicKey,
  destination: Signer | PublicKey
) => {
  const pda = getFreezeEscrow(umi, candyMachine, destination);
  const account = await fetchFreezeEscrow(umi, pda);
  return Number(account.frozenCount);
};

const assertFrozenCount = async (
  t: Assertions,
  umi: Umi,
  candyMachine: PublicKey,
  destination: Signer | PublicKey,
  expected: number
): Promise<void> => {
  const frozenCount = await getFrozenCount(umi, candyMachine, destination);
  t.is(frozenCount, expected, 'frozen count is correct');
};

const initFreezeEscrow = async (
  umi: Umi,
  candyMachine: PublicKey,
  destination: PublicKey,
  group?: string
) => {
  await route(umi, {
    candyMachine,
    guard: 'freezeSolPayment',
    group: group ? some(group) : none(),
    routeArgs: {
      path: 'initialize',
      period: 15 * 24 * 3600, // 15 days.
      candyGuardAuthority: umi.identity,
      destination,
    },
  }).sendAndConfirm(umi);
};

const mintNft = async (
  umi: Umi,
  candyMachine: PublicKey,
  destination: PublicKey,
  collection: PublicKey,
  group?: string
) => {
  const mint = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
        mintArgs: {
          freezeSolPayment: some({ destination }),
        },
        group: group ? some(group) : none(),
      })
    )
    .sendAndConfirm(umi);

  return mint;
};

const thawNft = async (
  umi: Umi,
  candyMachine: PublicKey,
  destination: PublicKey,
  asset: PublicKey,
  collection: PublicKey,
  group?: string
) =>
  transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      route(umi, {
        candyMachine,
        guard: 'freezeSolPayment',
        group: group ? some(group) : none(),
        routeArgs: {
          path: 'thaw',
          asset,
          collection,
          destination,
        },
      })
    )
    .sendAndConfirm(umi);

const unlockFunds = async (
  umi: Umi,
  candyMachine: PublicKey,
  destination: PublicKey,
  group?: string,
  candyGuardAuthority?: Signer
) => {
  await route(umi, {
    candyMachine,
    guard: 'freezeSolPayment',
    group: group ? some(group) : none(),
    routeArgs: {
      path: 'unlockFunds',
      candyGuardAuthority: candyGuardAuthority ?? umi.identity,
      destination,
    },
  }).sendAndConfirm(umi);
};
