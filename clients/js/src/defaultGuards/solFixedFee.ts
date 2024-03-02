import {
  getSolFixedFeeSerializer,
  SolFixedFee,
  SolFixedFeeArgs,
} from '../generated';
import { GuardManifest, noopParser } from '../guards';

/**
 * The solFixedFee guard is used to charge an
 * amount in SOL for the minted NFT as a fee.
 */
export const solFixedFeeGuardManifest: GuardManifest<
  SolFixedFeeArgs,
  SolFixedFee,
  SolFixedFeeMintArgs
> = {
  name: 'solFixedFee',
  serializer: getSolFixedFeeSerializer,
  mintParser: (context, mintContext, args) => ({
    data: new Uint8Array(),
    remainingAccounts: [{ publicKey: args.destination, isWritable: true }],
  }),
  routeParser: noopParser,
};

export type SolFixedFeeMintArgs = Omit<SolFixedFeeArgs, 'lamports'>;
