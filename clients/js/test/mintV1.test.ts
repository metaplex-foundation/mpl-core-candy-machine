/* eslint-disable no-await-in-loop */
import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox';
import {
  PublicKey,
  Umi,
  generateSigner,
  isEqualToAmount,
  none,
  sol,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import { generateSignerWithSol } from '@metaplex-foundation/umi-bundle-tests';
import test from 'ava';
import { fetchAssetV1 } from '@metaplex-foundation/mpl-core';
import { CandyMachine, fetchCandyMachine, mintV1 } from '../src';
import {
  assertSuccessfulMint,
  createCollection,
  createUmi,
  createV2,
  tomorrow,
  yesterday,
} from './_setup';

test('it can mint from a candy guard with no guards', async (t) => {
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
  const mint = generateSigner(umi);
  const minter = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        minter,
        asset: mint,
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

test('it can mint from a candy guard with guards', async (t) => {
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
  const mint = generateSigner(umi);
  const minter = generateSigner(umi);
  const payer = await generateSignerWithSol(umi, sol(10));
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        payer,
        minter,
        collection,
        mintArgs: {
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

test('it can mint from a candy guard with guards to different owner', async (t) => {
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
  const mint = generateSigner(umi);
  const minter = generateSigner(umi);
  const payer = await generateSignerWithSol(umi, sol(10));
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        payer,
        minter,
        owner,
        collection,
        mintArgs: {
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

test('it can mint from a candy guard with groups', async (t) => {
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
        mintArgs: { solPayment: { destination } },
        group: 'GROUP1',
      })
    )
    .sendAndConfirm(umi);

  // Then the mint was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: minter });
});

test('it cannot mint using the default guards if the candy guard has groups', async (t) => {
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

  // When we try to mint using the default guards.
  const mint = generateSigner(umi);
  const minter = generateSigner(umi);
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        minter,
        collection,
        mintArgs: { solPayment: { destination } },
        group: none(),
      })
    )
    .sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { message: /RequiredGroupLabelNotFound/ });
});

test('it cannot mint from a group if the provided group label does not exist', async (t) => {
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

  // When we try to mint using a group that does not exist.
  const mint = generateSigner(umi);
  const minter = generateSigner(umi);
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        minter,
        collection,
        mintArgs: { solPayment: { destination } },
        group: 'GROUPX',
      })
    )
    .sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { message: /GroupNotFound/ });
});

test('it can mint using an explicit payer', async (t) => {
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

  // When we mint from it using that payer.
  const mint = generateSigner(umi);
  const minter = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        minter,
        payer,
        asset: mint,
        collection,
        mintArgs: { solPayment: { destination } },
      })
    )
    .sendAndConfirm(umi);

  // Then the mint was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: minter, name: 'Degen #1' });

  // And the payer was charged.
  const payerBalance = await umi.rpc.getBalance(payer.publicKey);
  t.true(isEqualToAmount(payerBalance, sol(8), sol(0.1)));
});

test('it cannot mint from an empty candy machine', async (t) => {
  // Given an empty candy machine.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [],
    guards: {},
  });

  // When we try to mint from it.
  const mint = generateSigner(umi);
  const minter = generateSigner(umi);
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        minter,
        collection,
      })
    )
    .sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { message: /CandyMachineEmpty/ });
});

test('it cannot mint from a candy machine that is not fully loaded', async (t) => {
  // Given a candy machine that is 50% loaded.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    itemsAvailable: 2,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {},
  });

  // When we try to mint from it.
  const mint = generateSigner(umi);
  const minter = generateSigner(umi);
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        minter,
        collection,
      })
    )
    .sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { message: /NotFullyLoaded/ });
});

test('it cannot mint from a candy machine that has been fully minted', async (t) => {
  // Given a candy machine that has been fully minted.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {},
  });
  const mint = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
      })
    )
    .sendAndConfirm(umi);
  await assertSuccessfulMint(t, umi, { mint, owner: umi.identity });

  // When we try to mint from it again.
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: generateSigner(umi),
        collection,
      })
    )
    .sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { message: /CandyMachineEmpty/ });
});

test('it can mint from a candy machine using hidden settings', async (t) => {
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

  // When we mint from it.
  const mint = generateSigner(umi);
  const minter = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        minter,
        asset: mint,
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

test('it can mint from a candy machine sequentially', async (t) => {
  // Given a candy machine with sequential config line settings.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const indices = Array.from({ length: 10 }, (x, i) => i + 1);
  const configLines = indices.map((index) => ({
    name: `${index}`,
    uri: `https://example.com/degen/${index}`,
  }));
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines,
    configLineSettings: {
      prefixName: '',
      nameLength: 32,
      prefixUri: '',
      uriLength: 200,
      isSequential: true,
    },
    guards: {},
  });

  // When we mint from it.
  const minted = await drain(umi, candyMachine, collection, indices.length);

  // Then the mints are sequential.
  t.deepEqual(indices, minted);
});

test('it can mint from a candy machine in a random order', async (t) => {
  // Given a candy machine with non-sequential config line settings.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const indices = Array.from({ length: 10 }, (x, i) => i + 1);
  const configLines = indices.map((index) => ({
    name: `${index}`,
    uri: `https://example.com/degen/${index}`,
  }));
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines,
    configLineSettings: {
      prefixName: '',
      nameLength: 32,
      prefixUri: '',
      uriLength: 200,
      isSequential: false,
    },
    guards: {},
  });

  // When we mint from it.
  const minted = await drain(umi, candyMachine, collection, indices.length);

  // Then the mints are not sequential.
  t.notDeepEqual(indices, minted);

  // And the mints are unique.
  minted.sort((a, b) => a - b);
  t.deepEqual(indices, minted);
});

test('it can mint a programmable NFT', async (t) => {
  // Given a candy machine with a candy guard that mints PNFTs.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {},
  });

  // When we mint from it whilst specifying the token standard.
  const mint = generateSigner(umi);
  const minter = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        minter,
        asset: mint,
        collection,
      })
    )
    .sendAndConfirm(umi);

  // Then the mint was successful.
  await assertSuccessfulMint(t, umi, {
    mint,
    owner: minter,
  });

  // And the candy machine was updated.
  const candyMachineAccount = await fetchCandyMachine(umi, candyMachine);
  t.like(candyMachineAccount, <CandyMachine>{ itemsRedeemed: 1n });
});

const drain = async (
  umi: Umi,
  candyMachine: PublicKey,
  collectionMint: PublicKey,
  available: number
) => {
  const indices: number[] = [];

  for (let i = 0; i < available; i += 1) {
    const mint = generateSigner(umi);
    const minter = generateSigner(umi);
    await transactionBuilder()
      .add(setComputeUnitLimit(umi, { units: 600_000 }))
      .add(
        mintV1(umi, {
          candyMachine,
          minter,
          asset: mint,
          collection: collectionMint,
        })
      )
      .sendAndConfirm(umi);

    const asset = await fetchAssetV1(umi, mint.publicKey);
    indices.push(parseInt(asset.name, 10));
  }

  return indices;
};
