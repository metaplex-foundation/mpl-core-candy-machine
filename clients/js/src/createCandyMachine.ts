import { createAccount } from '@metaplex-foundation/mpl-toolbox';
import {
  Context,
  isNone,
  isOption,
  none,
  Signer,
  transactionBuilder,
  TransactionBuilder,
  wrapNullable,
} from '@metaplex-foundation/umi';
import { initializeCandyMachine } from './generated';
import { getCandyMachineSize } from './hooked';

export type CreateCandyMachineInput = Omit<
  Parameters<typeof initializeCandyMachine>[1],
  'candyMachine'
> & {
  candyMachine: Signer;
};

export const DEFAULT_CONFIG_LINE_SETTINGS = {
  prefixName: '',
  nameLength: 32,
  prefixUri: '',
  uriLength: 200,
  isSequential: false,
};

export const createCandyMachine = async (
  context: Parameters<typeof initializeCandyMachine>[0] & Pick<Context, 'rpc'>,
  input: CreateCandyMachineInput
): Promise<TransactionBuilder> => {
  const newInput = { ...input };

  const hiddenSettings = isOption(input.hiddenSettings)
    ? input.hiddenSettings
    : wrapNullable(input.hiddenSettings);

  const configLineSettings = isOption(input.configLineSettings)
    ? input.configLineSettings
    : wrapNullable(input.configLineSettings);

  if (isNone(hiddenSettings) && isNone(configLineSettings)) {
    newInput.configLineSettings = DEFAULT_CONFIG_LINE_SETTINGS;
  }

  const space = getCandyMachineSize(
    newInput.itemsAvailable,
    newInput.configLineSettings ?? none()
  );

  const lamports = await context.rpc.getRent(space);
  return transactionBuilder()
    .add(
      createAccount(context, {
        newAccount: newInput.candyMachine,
        lamports,
        space,
        programId: context.programs.get('mplCoreCandyMachineCore').publicKey,
      })
    )
    .add(
      initializeCandyMachine(context, {
        ...newInput,
        candyMachine: newInput.candyMachine.publicKey,
      })
    );
};
