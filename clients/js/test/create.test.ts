import {
  generateSigner,
  none,
  publicKey,
  sol,
  some,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import test from 'ava';
import {
  CandyGuard,
  CandyMachine,
  create,
  createCandyGuard,
  createCandyMachineV2,
  emptyDefaultGuardSetArgs,
  fetchCandyGuard,
  fetchCandyMachine,
  findCandyGuardPda,
  GuardGroup,
  GuardSet,
  MintType,
  wrap,
} from '../src';
import { createCollection, createUmi, defaultCandyMachineData } from './_setup';

test('it can create a candy machine with an associated candy guard', async (t) => {
  // Given an existing collection NFT.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;

  // When we create a new candy machine with an associated candy guard.
  const candyMachine = generateSigner(umi);
  const destination = generateSigner(umi).publicKey;
  const createInstructions = await create(umi, {
    candyMachine,
    collection,
    guards: {
      botTax: some({ lamports: sol(0.01), lastInstruction: true }),
      solPayment: some({ lamports: sol(2), destination }),
    },
    mintType: MintType.Core,
    ...defaultCandyMachineData(umi),
  });
  await transactionBuilder().add(createInstructions).sendAndConfirm(umi);

  // Then we created a new candy guard derived from the candy machine's address.
  const candyGuard = findCandyGuardPda(umi, { base: candyMachine.publicKey });
  const candyGuardAccount = await fetchCandyGuard(umi, candyGuard);
  t.like(candyGuardAccount, <CandyGuard>{
    publicKey: publicKey(candyGuard),
    base: publicKey(candyMachine),
    authority: publicKey(umi.identity),
    guards: {
      ...emptyDefaultGuardSetArgs,
      botTax: some({ lamports: sol(0.01), lastInstruction: true }),
      solPayment: some({ lamports: sol(2), destination }),
    },
    groups: [] as GuardGroup<GuardSet>[],
  });

  // And the created candy machine uses it as a mint authority.
  const candyMachineAccount = await fetchCandyMachine(
    umi,
    candyMachine.publicKey
  );
  t.like(candyMachineAccount, <CandyMachine>{
    publicKey: publicKey(candyMachine),
    authority: publicKey(umi.identity),
    mintAuthority: publicKey(candyGuard),
  });
});

test('it can create a candy machine with associated guards in separate txs', async (t) => {
  // Given an existing collection NFT.
  const umi = await createUmi();
  const collection = (await createCollection(umi)).publicKey;

  // When we create a new candy machine with an associated candy guard.
  const candyMachine = generateSigner(umi);
  const destination = generateSigner(umi).publicKey;

  const candyGuard = findCandyGuardPda(umi, {
    base: candyMachine.publicKey,
  });
  // await transactionBuilder().add(createInstructions).sendAndConfirm(umi);
  const res = await (await createCandyMachineV2(umi, {
    candyMachine,
    collection,
    mintType: MintType.Core,
    ...defaultCandyMachineData(umi),
    hiddenSettings: {
      name: 'Degen #$ID+1$',
      uri: 'https://example.com/degen/$ID+1$',
      hash: new Uint8Array(32),
    },
    configLineSettings: none()
  })).sendAndConfirm(umi);
    
  console.log((await umi.rpc.getTransaction(res.signature))?.meta.logs)
  
  const cm = await fetchCandyMachine(umi, candyMachine.publicKey);
  console.log(cm)

  await transactionBuilder().add(
      createCandyGuard(umi, {
        base: candyMachine,
        guards: {
          botTax: some({ lamports: sol(0.01), lastInstruction: true }),
          solPayment: some({ lamports: sol(2), destination }),
        },
      })
      ).sendAndConfirm(umi);
  await 
      wrap(umi, {
        candyGuard,
        candyMachine: candyMachine.publicKey,
      }).sendAndConfirm(umi);

  // Then we created a new candy guard derived from the candy machine's address.
  const candyGuardAccount = await fetchCandyGuard(umi, candyGuard);
  t.like(candyGuardAccount, <CandyGuard>{
    publicKey: publicKey(candyGuard),
    base: publicKey(candyMachine),
    authority: publicKey(umi.identity),
    guards: {
      ...emptyDefaultGuardSetArgs,
      botTax: some({ lamports: sol(0.01), lastInstruction: true }),
      solPayment: some({ lamports: sol(2), destination }),
    },
    groups: [] as GuardGroup<GuardSet>[],
  });

  // And the created candy machine uses it as a mint authority.
  const candyMachineAccount = await fetchCandyMachine(
    umi,
    candyMachine.publicKey
  );
  t.like(candyMachineAccount, <CandyMachine>{
    publicKey: publicKey(candyMachine),
    authority: publicKey(umi.identity),
    mintAuthority: publicKey(candyGuard),
  });
})