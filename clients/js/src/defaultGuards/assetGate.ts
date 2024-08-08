import { PublicKey } from '@metaplex-foundation/umi';
import { getAssetGateSerializer, AssetGate, AssetGateArgs } from '../generated';
import { GuardManifest, noopParser } from '../guards';

/**
 * The assetGate guard restricts minting to holders
 * of a specified NFT collection.
 *
 * This means the mint address of an NFT from this
 * collection must be passed when minting.
 */
export const assetGateGuardManifest: GuardManifest<
  AssetGateArgs,
  AssetGate,
  AssetGateMintArgs
> = {
  name: 'assetGate',
  serializer: getAssetGateSerializer,
  mintParser: (context, mintContext, args) => ({
    data: new Uint8Array(),
    remainingAccounts: [
      { publicKey: args.asset, isWritable: false },
    ],
  }),
  routeParser: noopParser,
};

export type AssetGateMintArgs = {
  /**
   * The address of an Asset from the required
   * collection that belongs to the payer.
   */
  asset: PublicKey;
};
