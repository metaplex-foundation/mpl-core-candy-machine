import { UmiError } from '@metaplex-foundation/umi';
import { CANDY_GUARD_LABEL_SIZE } from './constants';

export class CandyMachineError extends UmiError {
  readonly name: string = 'CandyMachineError';

  constructor(message: string, cause?: Error) {
    super(message, 'plugin', 'Candy Machine', cause);
  }
}

export class VariableSizeGuardError extends CandyMachineError {
  readonly name: string = 'VariableSizeGuardError';

  constructor(name: string) {
    const message =
      `Trying add a guard [${name}] with a variable-size serializer. ` +
      `The Candy Guard program only works with fixed-size guards. ` +
      'Please use the `fixSerializer` helper method to make it a fixed-size guard.';
    super(message);
  }
}

export class UnregisteredCandyGuardError extends CandyMachineError {
  readonly name: string = 'UnregisteredCandyGuardError';

  constructor(name: string) {
    const message =
      `Trying to access a custom guard named [${name}] that ` +
      `guard was not registered on the guard repository. ` +
      'Register your custom guard by calling the `umi.guards.add()` method.';
    super(message);
  }
}

export class GuardGroupRequiredError extends CandyMachineError {
  readonly name: string = 'GuardGroupRequiredError';

  constructor(availableGroups: string[]) {
    const message =
      'The provided Candy Machine defines groups of guards but no' +
      'group label was provided to identity which group we should select. ' +
      'Please provide the label of the group you wish to select from via the `group` parameter. ' +
      `The available groups are [${availableGroups.join(', ')}]`;
    super(message);
  }
}

export class SelectedGuardGroupDoesNotExistError extends CandyMachineError {
  readonly name: string = 'SelectedGuardGroupDoesNotExistError';

  constructor(selectedGroup: string, availableGroups: string[]) {
    const message =
      `You're trying to select the guard group [${selectedGroup}] from a ` +
      `Candy Machine but this group does not exists on this Candy Machine. ${
        availableGroups.length > 0
          ? 'Please provide the label of a group that exists on the Candy Machine. ' +
            `The available groups are [${availableGroups.join(', ')}]`
          : 'There are no guard groups defined on the Candy Machine. ' +
            'Please set the `group` parameter to `null` or remove it altogether.'
      }`;
    super(message);
  }
}

export class GuardMintSettingsMissingError extends CandyMachineError {
  readonly name: string = 'GuardMintSettingsMissingError';

  constructor(guardName: string) {
    const message =
      `The Candy Machine you are trying to mint from has the [${guardName}] guard enabled. ` +
      'This guard requires you to provide some additional settings when minting which you did not provide. ' +
      `Please provide some minting settings for the [${guardName}] guard ` +
      `via the \`guards\` parameter like so: \`guards.${guardName} = {...}\`.`;
    super(message);
  }
}

export class GuardRouteNotSupportedError extends CandyMachineError {
  readonly name: string = 'GuardRouteNotSupportedError';

  constructor(guardName: string) {
    const message =
      `You are trying to call the route instruction of the [${guardName}] guard ` +
      'but this guard does not support this feature or did not register it on the SDK. ' +
      'Please select a guard that support the route instruction feature. ' +
      'If you are using a custom guard, make sure you registered the route instruction ' +
      'feature by implementing the `routeSettingsParser` method on the guard manifest.';
    super(message);
  }
}

export class CandyGuardRequiredOnCandyMachineError extends CandyMachineError {
  readonly name: string = 'CandyGuardRequiredOnCandyMachineError';

  constructor() {
    const message =
      `The provided Candy Machine does not have a Candy Guard associated with ` +
      `it yet, it is required for the operation you are trying to execute. ` +
      'Please provide a Candy Machine with an associated Candy Guard account.';
    super(message);
  }
}

export class GuardNotEnabledError extends CandyMachineError {
  readonly name: string = 'GuardNotEnabledError';

  constructor(guard: string, group: string | null) {
    const message =
      `${
        group
          ? `The guard [${guard}] is not enabled on the group [${group}] of the Candy Machine.`
          : `The guard [${guard}] is not enabled on the Candy Machine. `
      }Please provide a different guard or select a different group ` +
      `such that the provided guard is enabled on the selected group.`;
    super(message);
  }
}

export class GuardGroupLabelTooLongError extends CandyMachineError {
  readonly name: string = 'GuardGroupLabelTooLongError';

  constructor(label: string) {
    const message =
      `The provided group label [${label}] is too long. ` +
      `Group labels cannot be longer than ${CANDY_GUARD_LABEL_SIZE} characters. ` +
      'Please provide a shorter group label.';
    super(message);
  }
}

export class UnrecognizePathForRouteInstructionError extends CandyMachineError {
  readonly name: string = 'UnrecognizePathForRouteInstructionError';

  constructor(guard: string, path: never) {
    const message =
      `The provided path [${path}] does not exist on the route instruction of the [${guard}] guard. ` +
      'Please provide a recognized path.';
    super(message);
  }
}

export class MintOwnerMustBeMintPayerError extends CandyMachineError {
  readonly name: string = 'MintOwnerMustBeMintPayerError';

  constructor(guard: string) {
    const message =
      `The payer must be the owner when using the [${guard}] guard. ` +
      'Please remove the `owner` attribute from the mint input so they can be the same.';
    super(message);
  }
}

export class MaximumOfFiveAdditionalProgramsError extends CandyMachineError {
  readonly name: string = 'MaximumOfFiveAdditionalProgramsError';

  constructor() {
    const message =
      `There is a maximum of five additional programs when using the [programGate] guard. ` +
      'Please reduce the number of additional programs to <= 5.';
    super(message);
  }
}

export class ExceededRegexLengthError extends CandyMachineError {
  readonly name: string = 'ExceededRegexLengthError';

  constructor() {
    const message =
      `The maximum length of a regex that can be used is 100 characters. ` +
      'Please reduce the length of the regex to <= 100.';
    super(message);
  }
}
