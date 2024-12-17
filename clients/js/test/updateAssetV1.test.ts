/* eslint-disable no-await-in-loop */
import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox';
import {
  generateSigner,
  isEqualToAmount,
  none,
  publicKey,
  sol,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import { generateSignerWithSol } from '@metaplex-foundation/umi-bundle-tests';
import test from 'ava';
import { CandyMachine, fetchCandyMachine, findCandyMachineAuthorityPda, updateAssetV1 } from '../src';
import {
  assertSuccessfulMint,
  createAsset,
  createCollection,
  createUmi,
  createV2,
  tomorrow,
  yesterday,
} from './_setup';

test('it can update an asset from a candy guard with no guards', async (t) => {
  // Given a candy machine with a candy guard that has no guards.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const candyMachineSigner = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {},
    groups: [],
  });
  const candyMachine = candyMachineSigner.publicKey;

  // When we mint from the candy guard.
  const authorityPda = findCandyMachineAuthorityPda(umi, { candyMachine: candyMachineSigner.publicKey });
  const minter = generateSigner(umi);
  const mint = await createAsset(umi, {
    owner: minter.publicKey,
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
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      updateAssetV1(umi, {
        candyMachine,
        minter,
        asset: mint.publicKey,
        collection,
      })
    )
    .sendAndConfirm(umi);

  // Then the mint was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: minter, name: 'Degen #1' });

  // And the candy machine was updated.
  const candyMachineAccount = await fetchCandyMachine(umi, candyMachine);
  t.like(candyMachineAccount, <CandyMachine>{ itemsRedeemed: 1n });
});

test('it can update an asset from a candy guard with guards', async (t) => {
  // Given a candy machine with some guards.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const destination = generateSigner(umi).publicKey;
  const candyMachineSigner = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: { lamports: sol(0.01), lastInstruction: true },
      solPayment: { lamports: sol(2), destination },
    },
  });
  const candyMachine = candyMachineSigner.publicKey;

  // When we mint from the candy guard.
  const minter = generateSigner(umi);
  const authorityPda = findCandyMachineAuthorityPda(umi, { candyMachine: candyMachineSigner.publicKey });
  const mint = await createAsset(umi, {
    owner: minter.publicKey,
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
  const payer = await generateSignerWithSol(umi, sol(10));
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      updateAssetV1(umi, {
        candyMachine,
        asset: mint.publicKey,
        payer,
        minter,
        collection,
        updateArgs: {
          solPayment: { destination },
        },
      })
    )
    .sendAndConfirm(umi);

  // Then the mint was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: minter, name: 'Degen #1' });

  // And the payer was charged.
  const payerBalance = await umi.rpc.getBalance(payer.publicKey);
  t.true(isEqualToAmount(payerBalance, sol(8), sol(0.1)));

  // And the candy machine was updated.
  const candyMachineAccount = await fetchCandyMachine(umi, candyMachine);
  t.like(candyMachineAccount, <CandyMachine>{ itemsRedeemed: 1n });
});

test('it can update an asset from a candy guard with guards to different owner', async (t) => {
  // Given a candy machine with some guards.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const owner = generateSigner(umi).publicKey;
  const destination = generateSigner(umi).publicKey;
  const candyMachineSigner = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: { lamports: sol(0.01), lastInstruction: true },
      solPayment: { lamports: sol(2), destination },
    },
  });
  const candyMachine = candyMachineSigner.publicKey;

  // When we mint from the candy guard.
  const minter = generateSigner(umi);
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
  const payer = await generateSignerWithSol(umi, sol(10));
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      updateAssetV1(umi, {
        candyMachine,
        asset: mint.publicKey,
        payer,
        minter,
        owner,
        collection,
        updateArgs: {
          solPayment: { destination },
        },
      })
    )
    .sendAndConfirm(umi);

  // Then the mint was successful.
  await assertSuccessfulMint(t, umi, { mint, owner, name: 'Degen #1' });

  // And the payer was charged.
  const payerBalance = await umi.rpc.getBalance(payer.publicKey);
  t.true(isEqualToAmount(payerBalance, sol(8), sol(0.1)));

  // And the candy machine was updated.
  const candyMachineAccount = await fetchCandyMachine(umi, candyMachine);
  t.like(candyMachineAccount, <CandyMachine>{ itemsRedeemed: 1n });
});

test('it can update an asset from a candy guard with groups', async (t) => {
  // Given a candy machine with guard groups.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const destination = generateSigner(umi).publicKey;
  const candyMachineSigner = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: { lamports: sol(0.01), lastInstruction: true },
      solPayment: { lamports: sol(2), destination },
    },
    groups: [
      { label: 'GROUP1', guards: { startDate: { date: yesterday() } } },
      { label: 'GROUP2', guards: { startDate: { date: tomorrow() } } },
    ],
  });
  const candyMachine = candyMachineSigner.publicKey;

  // When we mint from it using GROUP1.
  const minter = generateSigner(umi);
  const authorityPda = findCandyMachineAuthorityPda(umi, { candyMachine: candyMachineSigner.publicKey });
  const mint = await createAsset(umi, {
    owner: minter.publicKey,
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
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      updateAssetV1(umi, {
        candyMachine,
        asset: mint.publicKey,
        minter,
        collection,
        updateArgs: { solPayment: { destination } },
        group: 'GROUP1',
      })
    )
    .sendAndConfirm(umi);

  // Then the mint was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: minter });
});

test('it cannot update an asset using the default guards if the candy guard has groups', async (t) => {
  // Given a candy machine with guard groups.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const destination = generateSigner(umi).publicKey;
  const candyMachineSigner = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: { solPayment: { lamports: sol(2), destination } },
    groups: [
      { label: 'GROUP1', guards: { startDate: { date: yesterday() } } },
      { label: 'GROUP2', guards: { startDate: { date: tomorrow() } } },
    ],
  });
  const candyMachine = candyMachineSigner.publicKey;

  // When we try to update an asset using the default guards.
  const minter = generateSigner(umi);
  const authorityPda = findCandyMachineAuthorityPda(umi, { candyMachine: candyMachineSigner.publicKey });
  const mint = await createAsset(umi, {
    owner: minter.publicKey,
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
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      updateAssetV1(umi, {
        candyMachine,
        asset: mint.publicKey,
        minter,
        collection,
        updateArgs: { solPayment: { destination } },
        group: none(),
      })
    )
    .sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { message: /RequiredGroupLabelNotFound/ });
});

test('it cannot update an asset from a group if the provided group label does not exist', async (t) => {
  // Given a candy machine with no guard groups.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const destination = generateSigner(umi).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: { solPayment: { lamports: sol(2), destination } },
    groups: [{ label: 'GROUP1', guards: { startDate: { date: yesterday() } } }],
  });

  // When we try to update an asset using a group that does not exist.
  const minter = generateSigner(umi);
  const authorityPda = findCandyMachineAuthorityPda(umi, { candyMachine });
  const mint = await createAsset(umi, {
    owner: minter.publicKey,
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
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      updateAssetV1(umi, {
        candyMachine,
        asset: mint.publicKey,
        minter,
        collection,
        updateArgs: { solPayment: { destination } },
        group: 'GROUPX',
      })
    )
    .sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { message: /GroupNotFound/ });
});

test('it can update an asset using an explicit payer', async (t) => {
  // Given a candy machine with guards.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const destination = generateSigner(umi).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: { solPayment: { lamports: sol(2), destination } },
  });

  // And an explicit payer with 10 SOL.
  const payer = await generateSignerWithSol(umi, sol(10));

  // When we update an asset from it using that payer.
  const minter = generateSigner(umi);
  const authorityPda = findCandyMachineAuthorityPda(umi, { candyMachine });
  const mint = await createAsset(umi, {
    owner: minter.publicKey,
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
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      updateAssetV1(umi, {
        candyMachine,
        minter,
        payer,
        asset: mint.publicKey,
        collection,
        updateArgs: { solPayment: { destination } },
      })
    )
    .sendAndConfirm(umi);

  // Then the mint was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: minter, name: 'Degen #1' });

  // And the payer was charged.
  const payerBalance = await umi.rpc.getBalance(payer.publicKey);
  t.true(isEqualToAmount(payerBalance, sol(8), sol(0.1)));
});

test('it cannot update an asset from an empty candy machine', async (t) => {
  // Given an empty candy machine.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [],
    guards: {},
  });

  // When we try to update an asset from it.
  const minter = generateSigner(umi);
  const authorityPda = findCandyMachineAuthorityPda(umi, { candyMachine });
  const mint = await createAsset(umi, {
    owner: minter.publicKey,
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
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      updateAssetV1(umi, {
        candyMachine,
        asset: mint.publicKey,
        minter,
        collection,
      })
    )
    .sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { message: /CandyMachineEmpty/ });
});

test('it cannot update an asset from a candy machine that is not fully loaded', async (t) => {
  // Given a candy machine that is 50% loaded.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    itemsAvailable: 2,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {},
  });

  // When we try to update an asset from it.
  const minter = generateSigner(umi);
  const authorityPda = findCandyMachineAuthorityPda(umi, { candyMachine });
  const mint = await createAsset(umi, {
    owner: minter.publicKey,
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
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      updateAssetV1(umi, {
        candyMachine,
        asset: mint.publicKey,
        minter,
        collection,
      })
    )
    .sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { message: /NotFullyLoaded/ });
});

test('it cannot update an asset from a candy machine that has been fully minted', async (t) => {
  // Given a candy machine that has been fully minted.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {},
  });
  const minter = generateSigner(umi);
  const authorityPda = findCandyMachineAuthorityPda(umi, { candyMachine });
  const mint = await createAsset(umi, {
    owner: minter.publicKey,
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
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      updateAssetV1(umi, {
        candyMachine,
        asset: mint,
        collection,
      })
    )
    .sendAndConfirm(umi);
  await assertSuccessfulMint(t, umi, { mint, owner: minter.publicKey });

  // When we try to mint from it again.
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      updateAssetV1(umi, {
        candyMachine,
        asset: mint.publicKey,
        collection,
      })
    )
    .sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { message: /CandyMachineEmpty/ });
});

test('it can update an asset from a candy machine using hidden settings', async (t) => {
  // Given a candy machine with hidden settings.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    itemsAvailable: 100,
    configLineSettings: none(),
    hiddenSettings: {
      name: 'Degen #$ID+1$',
      uri: 'https://example.com/degen/$ID+1$',
      hash: new Uint8Array(32),
    },
    guards: {},
  });

  // When we update an asset from it.
  const minter = generateSigner(umi);
  const authorityPda = findCandyMachineAuthorityPda(umi, { candyMachine });
  const mint = await createAsset(umi, {
    owner: minter.publicKey,
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
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      updateAssetV1(umi, {
        candyMachine,
        minter,
        asset: mint.publicKey,
        collection,
      })
    )
    .sendAndConfirm(umi);

  // Then the mint was successful.
  await assertSuccessfulMint(t, umi, {
    mint,
    owner: minter,
    name: 'Degen #1',
    uri: 'https://example.com/degen/1',
  });
});
