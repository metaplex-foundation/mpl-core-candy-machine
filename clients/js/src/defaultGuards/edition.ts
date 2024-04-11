import {
  getEditionSerializer,
  Edition,
  EditionArgs,
} from '../generated';
import { GuardManifest, noopParser } from '../guards';

/**
 * The edition guard is used add the edition plugin to minted assets
 */
export const editionGuardManifest: GuardManifest<
  EditionArgs,
  Edition,
  EditionMintArgs
> = {
  name: 'edition',
  serializer: getEditionSerializer,
  mintParser: noopParser,
  routeParser: noopParser,
};

export type EditionMintArgs = Omit<EditionArgs, 'lamports'>;
