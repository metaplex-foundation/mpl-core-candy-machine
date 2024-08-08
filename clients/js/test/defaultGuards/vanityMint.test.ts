import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox';
import {
  generateSigner,
  sol,
  some,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import test from 'ava';
import { mintV1 } from '../../src';
import {
  assertBotTax,
  assertSuccessfulMint,
  createCollection,
  createUmi,
  createV2,
} from '../_setup';

test('it can mint an asset that starts with a specific pattern', async (t) => {
  // Given a candy machine with a start date in the past.
  const umi = await createUmi();
  const mint = generateSigner(umi);
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      vanityMint: some({ regex: `^${mint.publicKey.toString().slice(0, 5)}` }),
    },
  });

  // When we mint from it.
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

  // Then the mint was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: umi.identity });
});

test('it cannot mint an asset that does not start with a specific pattern', async (t) => {
  // Given a candy machine with a start date in the past.
  const umi = await createUmi();
  const mint = generateSigner(umi);
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      vanityMint: some({ regex: `^OOOO` }),
    },
  });

  // When we mint from it.
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
      })
    )
    .sendAndConfirm(umi);

  // Then the mint was unsuccessful.
  await t.throwsAsync(promise, { message: /InvalidVanityAddress/ });
});

test('it can mint an asset that ends with a specific pattern', async (t) => {
  // Given a candy machine with a start date in the past.
  const umi = await createUmi();
  const mint = generateSigner(umi);
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      vanityMint: some({ regex: `${mint.publicKey.toString().slice(-4)}$` }),
    },
  });

  // When we mint from it.
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

  // Then the mint was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: umi.identity });
});

test('it cannot mint an asset that does not end with a specific pattern', async (t) => {
  // Given a candy machine with a start date in the past.
  const umi = await createUmi();
  const mint = generateSigner(umi);
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      vanityMint: some({ regex: `OOOO$` }),
    },
  });

  // When we mint from it.
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
      })
    )
    .sendAndConfirm(umi);

  // Then the mint was unsuccessful.
  await t.throwsAsync(promise, { message: /InvalidVanityAddress/ });
});

test('it can mint an asset that exactly matches a specific pattern', async (t) => {
  // Given a candy machine with a start date in the past.
  const umi = await createUmi();
  const mint = generateSigner(umi);
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      vanityMint: some({ regex: `^${mint.publicKey.toString()}$` }),
    },
  });

  // When we mint from it.
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

  // Then the mint was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: umi.identity });
});

test('it cannot mint an asset that does not exactly match a specific pattern', async (t) => {
  // Given a candy machine with a start date in the past.
  const umi = await createUmi();
  const mint = generateSigner(umi);
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      vanityMint: some({ regex: `^${mint.publicKey.toString().slice(1)}$` }),
    },
  });

  // When we mint from it.
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
      })
    )
    .sendAndConfirm(umi);

  // Then the mint was unsuccessful.
  await t.throwsAsync(promise, { message: /InvalidVanityAddress/ });
});

test('it charges a bot tax when trying to mint an asset that starts with a specific pattern', async (t) => {
  // Given a candy machine with a bot tax and start date in the future.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: some({ lamports: sol(0.01), lastInstruction: true }),
      // O is not valid in bs58, so this will always fail.
      vanityMint: some({ regex: `^OOOO` }),
    },
  });

  // When we mint from it.
  const mint = generateSigner(umi);
  const { signature } = await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
      })
    )
    .sendAndConfirm(umi);

  // Then we expect a silent bot tax error.
  await assertBotTax(t, umi, mint, signature, /InvalidVanityAddress/);
});
