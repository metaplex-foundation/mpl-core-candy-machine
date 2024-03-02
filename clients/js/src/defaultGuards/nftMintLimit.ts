import { findAssociatedTokenPda } from '@metaplex-foundation/mpl-toolbox';
import { findMetadataPda } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey } from '@metaplex-foundation/umi';
import {
  findNftMintCounterPda,
  getNftMintLimitSerializer,
  NftMintLimit,
  NftMintLimitArgs,
} from '../generated';
import { GuardManifest, noopParser } from '../guards';

/**
 * The nftMintLimit guard allows to specify a limit on the
 * number of mints for a specific NFT mint.
 *
 * The limit is set per NFT mint, per candy machine and per
 * identified (provided in the settings) to allow multiple
 * NFT mint limits within a Candy Machine. This is particularly
 * useful when using groups of guards and we want each of them
 * to have a different NFT mint limit.
 */
export const nftMintLimitGuardManifest: GuardManifest<
  NftMintLimitArgs,
  NftMintLimit,
  NftMintLimitMintArgs
> = {
  name: 'nftMintLimit',
  serializer: getNftMintLimitSerializer,
  mintParser: (context, mintContext, args) => {
    const tokenAccount =
      args.tokenAccount ??
      findAssociatedTokenPda(context, {
        mint: args.mint,
        owner: mintContext.minter.publicKey,
      })[0];
    const [tokenMetadata] = findMetadataPda(context, { mint: args.mint });
    const [mintCounter] = findNftMintCounterPda(context, {
      id: args.id,
      mint: args.mint,
      candyMachine: mintContext.candyMachine,
      candyGuard: mintContext.candyGuard,
    });

    return {
      data: new Uint8Array(),
      remainingAccounts: [
        { publicKey: mintCounter, isWritable: true },
        { publicKey: tokenAccount, isWritable: false },
        { publicKey: tokenMetadata, isWritable: false },
      ],
    };
  },
  routeParser: noopParser,
};

export type NftMintLimitMintArgs = {
  /**
   * The id of the NFT mint limit.
   */
  id: number;

  /**
   * The mint address of an NFT from the required
   * collection that belongs to the minter.
   */
  mint: PublicKey;

  /**
   * The token account linking the NFT with its owner.
   *
   * @defaultValue
   * Defaults to the associated token address using the
   * mint address of the NFT and the minter's address.
   */
  tokenAccount?: PublicKey;
};
