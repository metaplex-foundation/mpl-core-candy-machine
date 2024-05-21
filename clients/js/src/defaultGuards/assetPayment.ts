import { PublicKey } from '@metaplex-foundation/umi';
import {
  getAssetPaymentSerializer,
  AssetPayment,
  AssetPaymentArgs,
} from '../generated';
import { GuardManifest, GuardRemainingAccount, noopParser } from '../guards';

/**
 * The assetPayment guard allows minting by charging the
 * payer a Core Asset from a specified collection.
 * The asset will be transfered to a predefined destination.
 *
 * This means the mint address of the asset to transfer must be
 * passed when minting. This guard alone does not limit how many
 * times a holder can mint. A holder can mint as many times
 * as they have assets from the required collection to pay with.
 */
export const assetPaymentGuardManifest: GuardManifest<
  AssetPaymentArgs,
  AssetPayment,
  AssetPaymentMintArgs
> = {
  name: 'assetPayment',
  serializer: getAssetPaymentSerializer,
  mintParser: (context, mintContext, args) => {
    const remainingAccounts: GuardRemainingAccount[] = [
      { publicKey: args.asset, isWritable: true },
      { publicKey: args.requiredCollection, isWritable: false},
      { publicKey: args.destination, isWritable: false },
    ];

    return { data: new Uint8Array(), remainingAccounts };
  },
  routeParser: noopParser,
};

export type AssetPaymentMintArgs = AssetPaymentArgs & {
  /**
   * The address of the asset to pay with.
   * This must be part of the required collection and must
   * belong to the payer.
   */
  asset: PublicKey;
};
