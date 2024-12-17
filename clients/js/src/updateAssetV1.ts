import {
  Option,
  OptionOrNullable,
  TransactionBuilder,
  none,
  publicKey,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import { DefaultGuardSetMintArgs } from './defaultGuards';
import {
  UpdateAssetV1InstructionAccounts,
  updateAssetV1 as baseUpdateAssetV1,
} from './generated/instructions/updateAssetV1';
import {
  CandyGuardProgram,
  GuardRepository,
  GuardSetMintArgs,
  MintContext,
  parseGuardRemainingAccounts,
  parseMintArgs,
} from './guards';
import { findCandyGuardPda } from './hooked';

export { UpdateAssetV1InstructionAccounts };

export type UpdateAssetV2InstructionData<MA extends GuardSetMintArgs> = {
  discriminator: Array<number>;
  updateArgs: MA;
  group: Option<string>;
};

export type UpdateAssetV2InstructionDataArgs<MA extends GuardSetMintArgs> = {
  updateArgs?: Partial<MA>;
  group?: OptionOrNullable<string>;
};

export function updateAssetV1<MA extends GuardSetMintArgs = DefaultGuardSetMintArgs>(
  context: Parameters<typeof baseUpdateAssetV1>[0] & {
    coreGuards: GuardRepository;
  },
  input: UpdateAssetV1InstructionAccounts &
    UpdateAssetV2InstructionDataArgs<
      MA extends undefined ? DefaultGuardSetMintArgs : MA
    >
): TransactionBuilder {
  const { updateArgs = {}, group = none(), ...rest } = input;

  // Parsing mint data.
  const program = context.programs.get<CandyGuardProgram>('mplCoreCandyGuard');
  const candyMachine = publicKey(input.candyMachine, false);
  const mintContext: MintContext = {
    minter: input.minter ?? context.identity,
    payer: input.payer ?? context.payer,
    asset: publicKey(input.asset, false),
    candyMachine,
    candyGuard: publicKey(
      input.candyGuard ?? findCandyGuardPda(context, { base: candyMachine }),
      false
    ),
  };
  const { data, remainingAccounts } = parseMintArgs<
    MA extends undefined ? DefaultGuardSetMintArgs : MA
  >(context, program, mintContext, updateArgs);

  const ix = baseUpdateAssetV1(context, {
    ...rest,
    updateArgs: data,
    group,
  }).items[0];

  const [keys, signers] = parseGuardRemainingAccounts(remainingAccounts);
  ix.instruction.keys.push(...keys);
  ix.signers.push(...signers);

  return transactionBuilder([ix]);
}
