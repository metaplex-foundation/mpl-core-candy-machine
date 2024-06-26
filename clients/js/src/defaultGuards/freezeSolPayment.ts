import { getSplSystemProgramId } from '@metaplex-foundation/mpl-toolbox';
import { PublicKey, Signer } from '@metaplex-foundation/umi';
import { tuple, u64 } from '@metaplex-foundation/umi/serializers';
import { getMplCoreProgramId } from '@metaplex-foundation/mpl-core';
import { UnrecognizePathForRouteInstructionError } from '../errors';
import {
  FreezeInstruction,
  FreezeSolPayment,
  FreezeSolPaymentArgs,
  findFreezeEscrowPda,
  getFreezeInstructionSerializer,
  getFreezeSolPaymentSerializer,
} from '../generated';
import { GuardManifest, GuardRemainingAccount, RouteParser } from '../guards';

/**
 * The freezeSolPayment guard allows minting frozen NFTs by charging
 * the payer an amount in SOL. Frozen NFTs cannot be transferred
 * or listed on any marketplaces until thawed.
 *
 * The funds are transferred to a freeze escrow until all NFTs are thaw,
 * at which point, they can be transferred (unlocked) to the configured
 * destination account.
 *
 * @see {@link FreezeSolPaymentRouteArgs} to learn more about
 * the instructions that can be executed against this guard.
 */
export const freezeSolPaymentGuardManifest: GuardManifest<
  FreezeSolPaymentArgs,
  FreezeSolPayment,
  FreezeSolPaymentMintArgs,
  FreezeSolPaymentRouteArgs
> = {
  name: 'freezeSolPayment',
  serializer: getFreezeSolPaymentSerializer,
  mintParser: (context, mintContext, args) => {
    const [freezeEscrow] = findFreezeEscrowPda(context, {
      destination: args.destination,
      candyMachine: mintContext.candyMachine,
      candyGuard: mintContext.candyGuard,
    });

    return {
      data: new Uint8Array(),
      remainingAccounts: [{ publicKey: freezeEscrow, isWritable: true }],
    };
  },
  routeParser: (context, routeContext, args) => {
    const { path } = args;
    switch (path) {
      case 'initialize':
        return initializeRouteInstruction(context, routeContext, args);
      case 'thaw':
        return thawRouteInstruction(context, routeContext, args);
      case 'unlockFunds':
        return unlockFundsRouteInstruction(context, routeContext, args);
      default:
        throw new UnrecognizePathForRouteInstructionError(
          'freezeSolPayment',
          path
        );
    }
  },
};

export type FreezeSolPaymentMintArgs = Omit<
  FreezeSolPaymentArgs,
  'lamports'
> & {};

/**
 * The settings for the freezeSolPayment guard that should be provided
 * when accessing the guard's special "route" instruction.
 */
export type FreezeSolPaymentRouteArgs =
  | FreezeSolPaymentRouteArgsInitialize
  | FreezeSolPaymentRouteArgsThaw
  | FreezeSolPaymentRouteArgsUnlockFunds;

/**
 * The `initialize` path creates the freeze escrow account that will
 * hold the funds until all NFTs are thawed. It must be called before
 * any NFTs can be minted.
 *
 * ```ts
 * route(umi, {
 *   // ...
 *   guard: 'freezeSolPayment',
 *   routeArgs: {
 *     path: 'initialize',
 *     destination,
 *     period: 15 * 24 * 60 * 60, // 15 days.
 *     candyGuardAuthority,
 *   },
 * });
 * ```
 */
export type FreezeSolPaymentRouteArgsInitialize = Omit<
  FreezeSolPaymentArgs,
  'lamports'
> & {
  /** Selects the path to execute in the route instruction. */
  path: 'initialize';

  /** The freeze period in seconds (maximum 30 days). */
  period: number;

  /** The authority of the Candy Guard as a Signer. */
  candyGuardAuthority: Signer;
};

/**
 * The `thaw` path unfreezes one NFT if one of the following conditions are met:
 * - All NFTs have been minted.
 * - The configured period has elapsed (max 30 days).
 * - The Candy Machine account was deleted.
 *
 * Anyone can call this instruction. Since the funds are not transferrable
 * until all NFTs are thawed, it creates an incentive for the treasury to
 * thaw all NFTs as soon as possible.
 *
 * ```ts
 * route(umi, {
 *   // ...
 *   guard: 'freezeSolPayment',
 *   routeArgs: {
 *     path: 'thaw',
 *     destination,
 *     asset,
 *     collection,
 *   },
 * });
 * ```
 */
export type FreezeSolPaymentRouteArgsThaw = Omit<
  FreezeSolPaymentArgs,
  'lamports'
> & {
  /** Selects the path to execute in the route instruction. */
  path: 'thaw';

  /** The mint address of the NFT to thaw. */
  asset: PublicKey;

  /** The owner address of the NFT to thaw. */
  collection: PublicKey;
};

/**
 * The `unlockFunds` path transfers all of the escrow funds to the
 * configured destination address once all NFTs have been thawed.
 *
 * ```ts
 * route(umi, {
 *   // ...
 *   guard: 'freezeSolPayment',
 *   routeArgs: {
 *     path: 'unlockFunds',
 *     destination,
 *     candyGuardAuthority,
 *   },
 * });
 * ```
 */
export type FreezeSolPaymentRouteArgsUnlockFunds = Omit<
  FreezeSolPaymentArgs,
  'lamports'
> & {
  /** Selects the path to execute in the route instruction. */
  path: 'unlockFunds';

  /** The authority of the Candy Guard as a Signer. */
  candyGuardAuthority: Signer;
};

const initializeRouteInstruction: RouteParser<
  FreezeSolPaymentRouteArgsInitialize
> = (context, routeContext, args) => {
  const [freezeEscrow] = findFreezeEscrowPda(context, {
    destination: args.destination,
    candyMachine: routeContext.candyMachine,
    candyGuard: routeContext.candyGuard,
  });
  const serializer = tuple([getFreezeInstructionSerializer(), u64()]);
  return {
    data: serializer.serialize([FreezeInstruction.Initialize, args.period]),
    remainingAccounts: [
      { publicKey: freezeEscrow, isWritable: true },
      { signer: args.candyGuardAuthority, isWritable: false },
      { publicKey: getSplSystemProgramId(context), isWritable: false },
    ],
  };
};

const thawRouteInstruction: RouteParser<FreezeSolPaymentRouteArgsThaw> = (
  context,
  routeContext,
  args
) => {
  const [freezeEscrow] = findFreezeEscrowPda(context, {
    destination: args.destination,
    candyMachine: routeContext.candyMachine,
    candyGuard: routeContext.candyGuard,
  });

  const data = getFreezeInstructionSerializer().serialize(
    FreezeInstruction.Thaw
  );
  const remainingAccounts: GuardRemainingAccount[] = [
    { publicKey: freezeEscrow, isWritable: true },
    { publicKey: args.asset, isWritable: true },
    { publicKey: args.collection, isWritable: true },
    { publicKey: getMplCoreProgramId(context), isWritable: false },
    { publicKey: getSplSystemProgramId(context), isWritable: false },
  ];

  return { data, remainingAccounts };
};

const unlockFundsRouteInstruction: RouteParser<
  FreezeSolPaymentRouteArgsUnlockFunds
> = (context, routeContext, args) => {
  const [freezeEscrow] = findFreezeEscrowPda(context, {
    destination: args.destination,
    candyMachine: routeContext.candyMachine,
    candyGuard: routeContext.candyGuard,
  });
  return {
    data: getFreezeInstructionSerializer().serialize(
      FreezeInstruction.UnlockFunds
    ),
    remainingAccounts: [
      { publicKey: freezeEscrow, isWritable: true },
      { signer: args.candyGuardAuthority, isWritable: false },
      { publicKey: args.destination, isWritable: true },
      { publicKey: getSplSystemProgramId(context), isWritable: false },
    ],
  };
};
