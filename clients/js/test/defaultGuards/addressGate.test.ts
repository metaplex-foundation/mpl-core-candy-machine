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

test('it allows minting from a specific address only', async (t) => {
  // Given a loaded Candy Machine with an addressGate guard.
  const umi = await createUmi();
  const allowedAddress = generateSigner(umi);
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      addressGate: some({ address: allowedAddress.publicKey }),
    },
  });

  // When the allowed address mints from it.
  const mint = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        minter: allowedAddress,
        collection,
      })
    )
    .sendAndConfirm(umi);

  // Then minting was successful.
  await assertSuccessfulMint(t, umi, { mint, owner: allowedAddress });
});

test('it forbids minting from anyone else', async (t) => {
  // Given a candy machine with an addressGate guard.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      addressGate: some({ address: generateSigner(umi).publicKey }),
    },
  });

  // When another wallet tries to mint from it.
  const mint = generateSigner(umi);
  const unauthorizedMinter = generateSigner(umi);
  const promise = transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        minter: unauthorizedMinter,
        collection,
      })
    )
    .sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { message: /AddressNotAuthorized/ });
});

test('it charges a bot tax when trying to mint using the wrong address', async (t) => {
  // Given a candy machine with an addressGate guard and a bot tax.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;
  const { publicKey: candyMachine } = await createV2(umi, {
    collection,
    configLines: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: some({ lamports: sol(0.01), lastInstruction: true }),
      addressGate: some({ address: generateSigner(umi).publicKey }),
    },
  });

  // When another wallet tries to mint from it.
  const mint = generateSigner(umi);
  const unauthorizedMinter = generateSigner(umi);
  const { signature } = await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 600_000 }))
    .add(
      mintV1(umi, {
        candyMachine,
        asset: mint,
        minter: unauthorizedMinter,
        collection,
      })
    )
    .sendAndConfirm(umi);

  // Then we expect a silent bot tax error.
  await assertBotTax(t, umi, mint, signature, /AddressNotAuthorized/);
});
