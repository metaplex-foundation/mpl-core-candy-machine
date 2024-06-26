/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import { PublicKey } from '@metaplex-foundation/umi';
import {
  Serializer,
  publicKey as publicKeySerializer,
  struct,
} from '@metaplex-foundation/umi/serializers';

/**
 * Guard that charges another Core Asset from a specific collection as payment
 * for the mint.
 *
 * List of accounts required:
 *
 * 0. `[writeable]` Asset address.
 * 1. `[]` Collection address.
 * 2. `[]` Destination address.
 */

export type AssetPayment = {
  requiredCollection: PublicKey;
  destination: PublicKey;
};

export type AssetPaymentArgs = AssetPayment;

export function getAssetPaymentSerializer(): Serializer<
  AssetPaymentArgs,
  AssetPayment
> {
  return struct<AssetPayment>(
    [
      ['requiredCollection', publicKeySerializer()],
      ['destination', publicKeySerializer()],
    ],
    { description: 'AssetPayment' }
  ) as Serializer<AssetPaymentArgs, AssetPayment>;
}
