import { PublicKey } from '@metaplex-foundation/umi';
import {
  getAssetBurnMultiSerializer,
  AssetBurnMulti,
  AssetBurnMultiArgs,
} from '../generated';
import { GuardManifest, GuardRemainingAccount, noopParser } from '../guards';

/**
 * The assetBurn guard restricts the mint to holders of a predefined
 * Collection and burns the holder's asset(s) when minting.
 *
 */
export const assetBurnMultiGuardManifest: GuardManifest<
  AssetBurnMultiArgs,
  AssetBurnMulti,
  AssetBurnMultiMintArgs
> = {
  name: 'assetBurnMulti',
  serializer: getAssetBurnMultiSerializer,
  mintParser: (context, mintContext, args) => {
    const remainingAccounts: GuardRemainingAccount[] = [];
    remainingAccounts.push({ publicKey: args.requiredCollection, isWritable: true });

    args.assets.forEach((asset) => {
      remainingAccounts.push({ publicKey: asset, isWritable: true });
    })

    return { data: new Uint8Array(), remainingAccounts };
  },
  routeParser: noopParser,
};

export type AssetBurnMultiMintArgs = Omit<AssetBurnMultiArgs, 'num'> & {
  /**
   * The address of the asset(s) to burn.
   * This must be part of the required collection and must
   * belong to the payer.
   */
  assets: PublicKey[];
};
