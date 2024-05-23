import { PublicKey } from '@metaplex-foundation/umi';
import {
  getAssetPaymentMultiSerializer,
  AssetPaymentMulti,
  AssetPaymentMultiArgs,
} from '../generated';
import { GuardManifest, GuardRemainingAccount, noopParser } from '../guards';

/**
 * The assetPayment guard restricts the mint to holders of a predefined
 * Collection and burns the holder's asset(s) when minting.
 *
 */
export const assetPaymentMultiGuardManifest: GuardManifest<
  AssetPaymentMultiArgs,
  AssetPaymentMulti,
  AssetPaymentMultiMintArgs
> = {
  name: 'assetPaymentMulti',
  serializer: getAssetPaymentMultiSerializer,
  mintParser: (context, mintContext, args) => {
    const remainingAccounts: GuardRemainingAccount[] = [];
    remainingAccounts.push({ publicKey: args.requiredCollection, isWritable: true });
    remainingAccounts.push({ publicKey: args.destination, isWritable: true });

    args.assets.forEach((asset) => {
      remainingAccounts.push({ publicKey: asset, isWritable: true });
    })

    return { data: new Uint8Array(), remainingAccounts };
  },
  routeParser: noopParser,
};

export type AssetPaymentMultiMintArgs = Omit<AssetPaymentMultiArgs, 'num'> & {
  /**
   * The address of the asset(s) to pay.
   * This must be part of the required collection and must
   * belong to the payer.
   */
  assets: PublicKey[];
};
