import { PublicKey } from '@metaplex-foundation/umi';
import {
  findAssetMintCounterPda,
  getAssetMintLimitSerializer,
  AssetMintLimit,
  AssetMintLimitArgs,
} from '../generated';
import { GuardManifest, noopParser } from '../guards';

/**
 * The assetMintLimit guard allows to specify a limit on the
 * number of mints for a specific NFT mint.
 *
 * The limit is set per NFT mint, per candy machine and per
 * identified (provided in the settings) to allow multiple
 * NFT mint limits within a Candy Machine. This is particularly
 * useful when using groups of guards and we want each of them
 * to have a different NFT mint limit.
 */
export const assetMintLimitGuardManifest: GuardManifest<
  AssetMintLimitArgs,
  AssetMintLimit,
  AssetMintLimitMintArgs
> = {
  name: 'assetMintLimit',
  serializer: getAssetMintLimitSerializer,
  mintParser: (context, mintContext, args) => {
    const [mintCounter] = findAssetMintCounterPda(context, {
      id: args.id,
      asset: args.asset,
      candyMachine: mintContext.candyMachine,
      candyGuard: mintContext.candyGuard,
    });

    return {
      data: new Uint8Array(),
      remainingAccounts: [
        { publicKey: mintCounter, isWritable: true },
        { publicKey: args.asset, isWritable: false },
      ],
    };
  },
  routeParser: noopParser,
};

export type AssetMintLimitMintArgs = {
  /**
   * The id of the NFT mint limit.
   */
  id: number;

  /**
   * The mint address of an NFT from the required
   * collection that belongs to the minter.
   */
  asset: PublicKey;
};
