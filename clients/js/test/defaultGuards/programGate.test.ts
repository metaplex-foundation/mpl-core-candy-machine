import {
  addMemo,
  getSplMemoProgramId,
  setComputeUnitLimit,
} from '@metaplex-foundation/mpl-toolbox';
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

test('it allows minting with specified program in transaction', async (t) => {
  // Given a loaded Candy Machine with a programGate guard allowing the memo program.
  const umi = await createUmi();
  const memoProgram = getSplMemoProgramId(umi);
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      programGate: some({ additional: [memoProgram] }),
    },
  });

  // When we mint an NFT with a memo instruction in the transaction.
  const mint = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(addMemo(umi, { memo: 'Instruction from the Memo program' }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
      })
    )
    .sendAndConfirm(umi);

  // Then minting was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: umi.identity });
});

test('it allows minting even when the payer is different from the minter', async (t) => {
  // Given a loaded Candy Machine with a programGate guard allowing the memo program.
  const umi = await createUmi();
  const memoProgram = getSplMemoProgramId(umi);
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      programGate: some({ additional: [memoProgram] }),
    },
  });

  // When we mint an NFT with a memo instruction in the transaction
  // using an explicit minter.
  const mint = generateSigner(umi);
  const minter = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(addMemo(umi, { memo: 'Instruction from the Memo program' }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        minter,
        collection,
      })
    )
    .sendAndConfirm(umi);

  // Then minting was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: minter });
});

test('it forbids minting with unspecified program in transaction', async (t) => {
  // Given a loaded Candy Machine with a programGate guard allowing no additional programs.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      programGate: some({ additional: [] }),
    },
  });

  // When we try to mint an NFT with a memo instruction in the transaction.
  const mint = generateSigner(umi);
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(addMemo(umi, { memo: 'Instruction from the Memo program' }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
      })
    )
    .sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { message: /UnauthorizedProgramFound/ });
});

test('it forbids candy machine creation with more than 5 specified programs', async (t) => {
  // When we try to create a Candy Machine with a
  // programGate guard allowing more than 5 programs.
  const umi = await createUmi();
  const memoProgram = getSplMemoProgramId(umi);
  const collection = (await createCollection(umi)).publicKey;
  const promise = createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      programGate: some({ additional: Array(6).fill(memoProgram) }),
    },
  });

  // Then we expect a client error.
  await t.throwsAsync(promise, {
    name: 'MaximumOfFiveAdditionalProgramsError',
  });
});

test('it charges a bot tax when minting with unspecified program in transaction', async (t) => {
  // Given a loaded Candy Machine with a botTax guard
  // and a programGate guard allowing no additional programs.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: some({ lamports: sol(0.1), lastInstruction: true }),
      programGate: some({ additional: [] }),
    },
  });

  // When we try to mint an NFT with a memo instruction in the transaction.
  const mint = generateSigner(umi);
  const { signature } = await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(addMemo(umi, { memo: 'Instruction from the Memo program' }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        collection,
      })
    )
    .sendAndConfirm(umi);

  // Then we expect a silent bot tax error.
  await assertBotTax(t, umi, mint, signature, /UnauthorizedProgramFound/);
});
