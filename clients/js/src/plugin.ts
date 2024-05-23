import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { UmiPlugin } from '@metaplex-foundation/umi';
import {
  addressGateGuardManifest,
  allowListGuardManifest,
  allocationGuardManifest,
  botTaxGuardManifest,
  defaultCandyGuardNames,
  endDateGuardManifest,
  freezeSolPaymentGuardManifest,
  freezeTokenPaymentGuardManifest,
  gatekeeperGuardManifest,
  mintLimitGuardManifest,
  nftBurnGuardManifest,
  nftGateGuardManifest,
  nftPaymentGuardManifest,
  programGateGuardManifest,
  redeemedAmountGuardManifest,
  solPaymentGuardManifest,
  startDateGuardManifest,
  thirdPartySignerGuardManifest,
  token2022PaymentGuardManifest,
  tokenBurnGuardManifest,
  tokenGateGuardManifest,
  tokenPaymentGuardManifest,
  solFixedFeeGuardManifest,
  nftMintLimitGuardManifest,
  editionGuardManifest,
  assetPaymentGuardManifest,
  assetBurnGuardManifest,
} from './defaultGuards';
import {
  createMplCoreCandyGuardProgram,
  createMplCoreCandyMachineCoreProgram,
} from './generated';
import {
  CandyGuardProgram,
  DefaultGuardRepository,
  GuardRepository,
} from './guards';
import {
  createCivicGatewayProgram,
  createMplTokenAuthRulesProgram,
} from './programs';
import { assetMintLimitGuardManifest } from './defaultGuards/assetMintLimit';
import { assetBurnMultiGuardManifest } from './defaultGuards/assetBurnMulti';
import { assetPaymentMultiGuardManifest } from './defaultGuards/assetPaymentMulti';

export const mplCandyMachine = (): UmiPlugin => ({
  install(umi) {
    umi.use(mplTokenMetadata());

    // Programs.
    umi.programs.add(createMplCoreCandyMachineCoreProgram(), false);
    umi.programs.add(
      {
        ...createMplCoreCandyGuardProgram(),
        availableGuards: defaultCandyGuardNames,
      } as CandyGuardProgram,
      false
    );
    umi.programs.add(createCivicGatewayProgram(), false);
    umi.programs.add(createMplTokenAuthRulesProgram(), false);

    // Default Guards.
    umi.coreGuards = new DefaultGuardRepository();
    umi.coreGuards.add(
      botTaxGuardManifest,
      solPaymentGuardManifest,
      tokenPaymentGuardManifest,
      startDateGuardManifest,
      thirdPartySignerGuardManifest,
      tokenGateGuardManifest,
      gatekeeperGuardManifest,
      endDateGuardManifest,
      allowListGuardManifest,
      mintLimitGuardManifest,
      nftPaymentGuardManifest,
      redeemedAmountGuardManifest,
      addressGateGuardManifest,
      nftGateGuardManifest,
      nftBurnGuardManifest,
      tokenBurnGuardManifest,
      freezeSolPaymentGuardManifest,
      freezeTokenPaymentGuardManifest,
      programGateGuardManifest,
      allocationGuardManifest,
      token2022PaymentGuardManifest,
      solFixedFeeGuardManifest,
      nftMintLimitGuardManifest,
      editionGuardManifest,
      assetPaymentGuardManifest,
      assetBurnGuardManifest,
      assetMintLimitGuardManifest,
      assetBurnMultiGuardManifest,
      assetPaymentMultiGuardManifest,
    );
  },
});

declare module '@metaplex-foundation/umi' {
  interface Umi {
    coreGuards: GuardRepository;
  }
}
