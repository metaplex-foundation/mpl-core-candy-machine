/* eslint-disable no-await-in-loop */
import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox';
import {
  generateSigner,
  isEqualToAmount,
  none,
  sol,
  some,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import { generateSignerWithSol } from '@metaplex-foundation/umi-bundle-tests';
import test from 'ava';
import { CandyMachine, fetchCandyMachine, MintType, mintV2 } from '../src';
import {
  assertSuccessfulMint,
  createCollection,
  createUmi,
  createV2,
  tomorrow,
  yesterday,
} from './_setup';


test('it can mint edition from a candy guard with guards', async (t) => {
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
    mintType: MintType.CoreEdition,
  });
  const candyMachine = candyMachineSigner.publicKey;

  // When we mint from the candy guard.
  const mint = generateSigner(umi);
  const minter = generateSigner(umi);
  const payer = await generateSignerWithSol(umi, sol(10));
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV2(umi, {
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
  await assertSuccessfulMint(t, umi, { mint, owner: minter, name: 'Degen #1', edition: 1 });

  // And the payer was charged.
  const payerBalance = await umi.rpc.getBalance(payer.publicKey);
  t.true(isEqualToAmount(payerBalance, sol(8), sol(0.1)));

  // And the candy machine was updated.
  const candyMachineAccount = await fetchCandyMachine(umi, candyMachine);
  t.like(candyMachineAccount, <CandyMachine>{ itemsRedeemed: 1n });
});

test('it can mint edition from a candy guard with groups', async (t) => {
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
    mintType: MintType.CoreEdition,
  });
  const candyMachine = candyMachineSigner.publicKey;

  // When we mint from it using GROUP1.
  const mint = generateSigner(umi);
  const minter = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV2(umi, {
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
  await assertSuccessfulMint(t, umi, { mint, owner: minter, edition: 1 });
});

test('it can mint many editions from a candy machine with guard in order', async (t) => {
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const destination = generateSigner(umi).publicKey;
  const candyMachineSigner = await createV2(umi, {
    collection,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
    ],
    guards: {
      botTax: { lamports: sol(0.01), lastInstruction: true },
      solPayment: { lamports: sol(2), destination },
    },
    mintType: MintType.CoreEdition,
  });
  const candyMachine = candyMachineSigner.publicKey;

  // When we mint from the candy guard.
  for (let i = 1; i <= 5; i += 1) {
    const mint = generateSigner(umi);
    const minter = generateSigner(umi);
    const payer = await generateSignerWithSol(umi, sol(10));
    await transactionBuilder()
      .add(setComputeUnitLimit(umi, { units: 600_000 }))
      .add(
        mintV2(umi, {
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
      await assertSuccessfulMint(t, umi, { mint, owner: minter, edition: i });
  }
})

test('it can mint many editions from a candy machine with guard starting from offset', async (t) => {
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const destination = generateSigner(umi).publicKey;
  const candyMachineSigner = await createV2(umi, {
    collection,
    configLines: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
    ],
    guards: {
      botTax: { lamports: sol(0.01), lastInstruction: true },
      solPayment: { lamports: sol(2), destination },
    },
    mintType: MintType.CoreEdition,
    editionStartingNumber: some(5)
  });
  const candyMachine = candyMachineSigner.publicKey;

  // When we mint from the candy guard.
  for (let i = 1; i <= 5; i += 1) {
    const mint = generateSigner(umi);
    const minter = generateSigner(umi);
    const payer = await generateSignerWithSol(umi, sol(10));
    await transactionBuilder()
      .add(setComputeUnitLimit(umi, { units: 600_000 }))
      .add(
        mintV2(umi, {
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
      await assertSuccessfulMint(t, umi, { mint, owner: minter, edition: i + 5 });
  }
})

test('it can mint edition from a candy machine using hidden settings', async (t) => {
  // Given a candy machine with hidden settings.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    itemsAvailable: 100,
    configLineSettings: none(),
    mintType: MintType.CoreEdition,
    hiddenSettings: {
      name: 'Degen #$ID+1$',
      uri: 'https://example.com/degen/$ID+1$',
      hash: new Uint8Array(32),
    },
    guards: {},
  });

  // When we mint from it.
  for (let i = 1; i <= 5; i += 1) {
    const mint = generateSigner(umi);
    const minter = generateSigner(umi);
    await transactionBuilder()
      .add(setComputeUnitLimit(umi, { units: 600_000 }))
      .add(
        mintV2(umi, {
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
      name: `Degen #${i}`,
      uri: `https://example.com/degen/${i}`,
      edition: i,
    });
  }
});

test('it overflows when trying to mint editions out of bounds', async (t) => {
  // Given a candy machine with hidden settings.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    itemsAvailable: 100,
    configLineSettings: none(),
    mintType: MintType.CoreEdition,
    hiddenSettings: {
      name: 'Degen #$ID+1$',
      uri: 'https://example.com/degen/$ID+1$',
      hash: new Uint8Array(32),
    },
    guards: {},
    editionStartingNumber: some(2**32 - 1)
  });

  // When we try to mint out of bounds.
  const mint = generateSigner(umi);
  const minter = generateSigner(umi);
  const res = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV2(umi, {
        candyMachine,
        minter,
        asset: mint,
        collection,
      })
    )
    .sendAndConfirm(umi);

  // Then the mint failed.
  // TODO propogate candy core errors through the guard correctly
  await t.throwsAsync(res, {name: 'IncorrectOwner'})
})