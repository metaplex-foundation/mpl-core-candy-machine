/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import {
  Serializer,
  string,
  struct,
} from '@metaplex-foundation/umi/serializers';

/** Guard that sets a specific start date for the mint. */
export type VanityMint = { regex: string };

export type VanityMintArgs = VanityMint;

export function getVanityMintSerializer(): Serializer<
  VanityMintArgs,
  VanityMint
> {
  return struct<VanityMint>([['regex', string()]], {
    description: 'VanityMint',
  }) as Serializer<VanityMintArgs, VanityMint>;
}
