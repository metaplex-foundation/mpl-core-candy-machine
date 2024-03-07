import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox';
import {
  generateSigner,
  isEqualToAmount,
  sol,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import { generateSignerWithSol } from '@metaplex-foundation/umi-bundle-tests';
import test from 'ava';
import { mintV2 } from '../../src';
import {
  assertBotTax,
  assertSuccessfulMint,
  createCollection,
  createUmi,
  createV2,
} from '../_setup';

test('it transfers SOL from the payer to the destination', async (t) => {
  // Given a loaded Candy Machine with a solFixedFee guard.
  const umi = await createUmi();
  const destination = generateSigner(umi).publicKey;
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      solFixedFee: { lamports: sol(1), destination },
    },
  });

  // When we mint for another owner using an explicit payer.
  const payer = await generateSignerWithSol(umi, sol(10));
  const minter = generateSigner(umi);
  const mint = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV2(umi, {
        candyMachine,
        asset: mint,
        minter,
        payer,
        collection,
        mintArgs: { solFixedFee: { destination } },
      })
    )
    .sendAndConfirm(umi);

  // Then minting was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: minter });

  // And the treasury received SOLs.
  const treasuryBalance = await umi.rpc.getBalance(destination);
  t.true(isEqualToAmount(treasuryBalance, sol(1)), 'treasury received SOLs');

  // And the payer lost SOLs.
  const payerBalance = await umi.rpc.getBalance(payer.publicKey);
  t.true(isEqualToAmount(payerBalance, sol(9), sol(0.1)), 'payer lost SOLs');
});

test('it fails if the payer does not have enough funds', async (t) => {
  // Given a loaded Candy Machine with a solFixedFee guard costing 5 SOLs.
  const umi = await createUmi();
  const destination = generateSigner(umi).publicKey;
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      solFixedFee: { lamports: sol(5), destination },
    },
  });

  // When we mint from it using a payer that only has 4 SOL.
  const payer = await generateSignerWithSol(umi, sol(4));
  const mint = generateSigner(umi);
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV2(umi, {
        candyMachine,
        asset: mint,
        payer,
        collection,
        mintArgs: { solFixedFee: { destination } },
      })
    )
    .sendAndConfirm(umi);

  // Then we expect an error.
  await t.throwsAsync(promise, { message: /NotEnoughSOL/ });

  // And the payer didn't loose any SOL.
  const payerBalance = await umi.rpc.getBalance(payer.publicKey);
  t.true(isEqualToAmount(payerBalance, sol(4)), 'payer did not lose SOLs');
});

test('it charges a bot tax if the payer does not have enough funds', async (t) => {
  // Given a loaded Candy Machine with a solFixedFee guard costing 5 SOLs and a botTax guard.
  const umi = await createUmi();
  const destination = generateSigner(umi).publicKey;
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: { lamports: sol(0.1), lastInstruction: true },
      solFixedFee: { lamports: sol(5), destination },
    },
  });

  // When we mint from it using a payer that only has 4 SOL.
  const payer = await generateSignerWithSol(umi, sol(4));
  const mint = generateSigner(umi);
  const { signature } = await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV2(umi, {
        candyMachine,
        asset: mint,
        payer,
        collection,
        mintArgs: { solFixedFee: { destination } },
      })
    )
    .sendAndConfirm(umi);

  // Then we expect a bot tax error.
  await assertBotTax(t, umi, mint, signature, /NotEnoughSOL/);
});
