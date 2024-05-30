import { PublicKey } from '@metaplex-foundation/umi';
import { getAssetBurnSerializer, AssetBurn, AssetBurnArgs } from '../generated';
import { GuardManifest, GuardRemainingAccount, noopParser } from '../guards';

/**
 * The assetBurn guard allows minting by burning the
 * minter a Core Asset from a specified collection.
 * The asset will be burned.
 *
 * This means the mint address of the asset to transfer must be
 * passed when minting. This guard alone does not limit how many
 * times a holder can mint. A holder can mint as many times
 * as they have assets from the required collection to pay with.
 */
export const assetBurnGuardManifest: GuardManifest<
  AssetBurnArgs,
  AssetBurn,
  AssetBurnMintArgs
> = {
  name: 'assetBurn',
  serializer: getAssetBurnSerializer,
  mintParser: (context, mintContext, args) => {
    const remainingAccounts: GuardRemainingAccount[] = [
      { publicKey: args.asset, isWritable: true },
      { publicKey: args.requiredCollection, isWritable: true },
    ];

    return { data: new Uint8Array(), remainingAccounts };
  },
  routeParser: noopParser,
};

export type AssetBurnMintArgs = AssetBurnArgs & {
  /**
   * The address of the asset to pay with.
   * This must be part of the required collection and must
   * belong to the payer.
   */
  asset: PublicKey;
};
