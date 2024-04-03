import { createAccountWithRent } from '@metaplex-foundation/mpl-toolbox';
import {
  generateSigner,
  none,
  publicKey,
  some,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import test from 'ava';
import {
  AccountVersion,
  CandyMachine,
  fetchCandyMachine,
  initializeCandyMachineV2,
  MintType,
} from '../src';
import { createCollection, createUmi } from './_setup';

/**
 * Note that most of the tests for the "initializeCandyMachineV2" instructions are
 * part of the "createCandyMachineV2" tests as they are more convenient to test.
 */

test('it can initialize a new candy machine account', async (t) => {
  // Given an empty candy machine account with a big enough size.
  const umi = await createUmi();
  const candyMachine = generateSigner(umi);
  await transactionBuilder()
    .add(
      createAccountWithRent(umi, {
        newAccount: candyMachine,
        space: 5000,
        programId: umi.programs.get('mplCoreCandyMachineCore').publicKey,
      })
    )
    .sendAndConfirm(umi);

  // And a collection NFT.
  const collection = await createCollection(umi);

  // When we initialize a candy machine at this address.
  await transactionBuilder()
    .add(
      initializeCandyMachineV2(umi, {
        candyMachine: candyMachine.publicKey,
        mintType: MintType.Core,
        collection: collection.publicKey,
        collectionUpdateAuthority: umi.identity,
        itemsAvailable: 100,
        configLineSettings: some({
          prefixName: 'My NFT #',
          nameLength: 8,
          prefixUri: 'https://example.com/',
          uriLength: 20,
          isSequential: false,
        }),
      })
    )
    .sendAndConfirm(umi);

  // Then we expect the candy machine account to have the right data.
  const candyMachineAccount = await fetchCandyMachine(
    umi,
    candyMachine.publicKey
  );
  t.like(candyMachineAccount, <CandyMachine>{
    publicKey: publicKey(candyMachine),
    authority: publicKey(umi.identity),
    mintAuthority: publicKey(umi.identity),
    collectionMint: publicKey(collection),
    version: AccountVersion.V2,
    itemsRedeemed: 0n,
    data: {
      itemsAvailable: 100n,
      maxEditionSupply: 0n,
      isMutable: true,
      configLineSettings: some({
        prefixName: 'My NFT #',
        nameLength: 8,
        prefixUri: 'https://example.com/',
        uriLength: 20,
        isSequential: false,
      }),
      hiddenSettings: none(),
    },
  });
});
