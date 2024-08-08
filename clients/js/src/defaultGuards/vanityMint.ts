import {
  fixSerializer,
  mapSerializer,
} from '@metaplex-foundation/umi/serializers';
import { ExceededRegexLengthError } from '../errors';
import {
  getVanityMintSerializer,
  VanityMint,
  VanityMintArgs,
} from '../generated';
import { GuardManifest, noopParser } from '../guards';

/**
 * The vanityMint guard verifies that the new asset
 * address matches the provided regex.
 */
export const vanityMintGuardManifest: GuardManifest<
  VanityMintArgs,
  VanityMint
> = {
  name: 'vanityMint',
  serializer: () =>
    mapSerializer(
      fixSerializer(getVanityMintSerializer(), 4 + 100),
      (value) => {
        if (value.regex.length > 100) {
          throw new ExceededRegexLengthError();
        }
        return value;
      }
    ),
  mintParser: noopParser,
  routeParser: noopParser,
};
