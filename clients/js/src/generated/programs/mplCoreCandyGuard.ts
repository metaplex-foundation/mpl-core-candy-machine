/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import {
  ClusterFilter,
  Context,
  Program,
  PublicKey,
} from '@metaplex-foundation/umi';
import {
  getMplCoreCandyGuardErrorFromCode,
  getMplCoreCandyGuardErrorFromName,
} from '../errors';

export const MPL_CORE_CANDY_GUARD_PROGRAM_ID =
  'CMAGAKJ67e9hRZgfC5SFTbZH8MgEmtqazKXjmkaJjWTJ' as PublicKey<'CMAGAKJ67e9hRZgfC5SFTbZH8MgEmtqazKXjmkaJjWTJ'>;

export function createMplCoreCandyGuardProgram(): Program {
  return {
    name: 'mplCoreCandyGuard',
    publicKey: MPL_CORE_CANDY_GUARD_PROGRAM_ID,
    getErrorFromCode(code: number, cause?: Error) {
      return getMplCoreCandyGuardErrorFromCode(code, this, cause);
    },
    getErrorFromName(name: string, cause?: Error) {
      return getMplCoreCandyGuardErrorFromName(name, this, cause);
    },
    isOnCluster() {
      return true;
    },
  };
}

export function getMplCoreCandyGuardProgram<T extends Program = Program>(
  context: Pick<Context, 'programs'>,
  clusterFilter?: ClusterFilter
): T {
  return context.programs.get<T>('mplCoreCandyGuard', clusterFilter);
}

export function getMplCoreCandyGuardProgramId(
  context: Pick<Context, 'programs'>,
  clusterFilter?: ClusterFilter
): PublicKey {
  return context.programs.getPublicKey(
    'mplCoreCandyGuard',
    MPL_CORE_CANDY_GUARD_PROGRAM_ID,
    clusterFilter
  );
}