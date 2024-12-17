import { none, Option, OptionOrNullable } from '@metaplex-foundation/umi';
import {
  AddressGate,
  AddressGateArgs,
  Allocation,
  AllocationArgs,
  AllowList,
  AllowListArgs,
  AssetBurn,
  AssetBurnArgs,
  AssetBurnMulti,
  AssetBurnMultiArgs,
  AssetGate,
  AssetGateArgs,
  AssetMintLimit,
  AssetMintLimitArgs,
  AssetPayment,
  AssetPaymentArgs,
  AssetPaymentMulti,
  AssetPaymentMultiArgs,
  BotTax,
  BotTaxArgs,
  Edition,
  EditionArgs,
  EndDate,
  EndDateArgs,
  FreezeSolPayment,
  FreezeSolPaymentArgs,
  FreezeTokenPayment,
  FreezeTokenPaymentArgs,
  Gatekeeper,
  GatekeeperArgs,
  MintLimit,
  MintLimitArgs,
  NftBurn,
  NftBurnArgs,
  NftGate,
  NftGateArgs,
  NftMintLimit,
  NftMintLimitArgs,
  NftPayment,
  NftPaymentArgs,
  ProgramGate,
  ProgramGateArgs,
  RedeemedAmount,
  RedeemedAmountArgs,
  SolFixedFee,
  SolFixedFeeArgs,
  SolPayment,
  SolPaymentArgs,
  StartDate,
  StartDateArgs,
  ThirdPartySigner,
  ThirdPartySignerArgs,
  Token2022Payment,
  Token2022PaymentArgs,
  TokenBurn,
  TokenBurnArgs,
  TokenGate,
  TokenGateArgs,
  TokenPayment,
  TokenPaymentArgs,
  VanityMint,
  VanityMintArgs,
} from '../generated';
import {
  GuardSet,
  GuardSetArgs,
  GuardSetMintArgs,
  GuardSetRouteArgs,
} from '../guards/guardSet';
import { AllocationMintArgs, AllocationRouteArgs } from './allocation';
import { AllowListMintArgs, AllowListRouteArgs } from './allowList';
import {
  FreezeSolPaymentMintArgs,
  FreezeSolPaymentRouteArgs,
} from './freezeSolPayment';
import {
  FreezeTokenPaymentMintArgs,
  FreezeTokenPaymentRouteArgs,
} from './freezeTokenPayment';
import { GatekeeperMintArgs } from './gatekeeper';
import { MintLimitMintArgs } from './mintLimit';
import { NftBurnMintArgs } from './nftBurn';
import { NftGateMintArgs } from './nftGate';
import { NftPaymentMintArgs } from './nftPayment';
import { SolPaymentMintArgs } from './solPayment';
import { ThirdPartySignerMintArgs } from './thirdPartySigner';
import { Token2022PaymentMintArgs } from './token2022Payment';
import { TokenBurnMintArgs } from './tokenBurn';
import { TokenGateMintArgs } from './tokenGate';
import { TokenPaymentMintArgs } from './tokenPayment';
import { SolFixedFeeMintArgs } from './solFixedFee';
import { NftMintLimitMintArgs } from './nftMintLimit';
import { AssetPaymentMintArgs } from './assetPayment';
import { AssetBurnMintArgs } from './assetBurn';
import { AssetMintLimitMintArgs } from './assetMintLimit';
import { AssetBurnMultiMintArgs } from './assetBurnMulti';
import { AssetPaymentMultiMintArgs } from './assetPaymentMulti';
import { AssetGateMintArgs } from './assetGate';

/**
 * The arguments for all default Candy Machine guards.
 */
export type DefaultGuardSetArgs = GuardSetArgs & {
  botTax: OptionOrNullable<BotTaxArgs>;
  solPayment: OptionOrNullable<SolPaymentArgs>;
  tokenPayment: OptionOrNullable<TokenPaymentArgs>;
  startDate: OptionOrNullable<StartDateArgs>;
  thirdPartySigner: OptionOrNullable<ThirdPartySignerArgs>;
  tokenGate: OptionOrNullable<TokenGateArgs>;
  gatekeeper: OptionOrNullable<GatekeeperArgs>;
  endDate: OptionOrNullable<EndDateArgs>;
  allowList: OptionOrNullable<AllowListArgs>;
  mintLimit: OptionOrNullable<MintLimitArgs>;
  nftPayment: OptionOrNullable<NftPaymentArgs>;
  redeemedAmount: OptionOrNullable<RedeemedAmountArgs>;
  addressGate: OptionOrNullable<AddressGateArgs>;
  nftGate: OptionOrNullable<NftGateArgs>;
  nftBurn: OptionOrNullable<NftBurnArgs>;
  tokenBurn: OptionOrNullable<TokenBurnArgs>;
  freezeSolPayment: OptionOrNullable<FreezeSolPaymentArgs>;
  freezeTokenPayment: OptionOrNullable<FreezeTokenPaymentArgs>;
  programGate: OptionOrNullable<ProgramGateArgs>;
  allocation: OptionOrNullable<AllocationArgs>;
  token2022Payment: OptionOrNullable<Token2022PaymentArgs>;
  solFixedFee: OptionOrNullable<SolFixedFeeArgs>;
  nftMintLimit: OptionOrNullable<NftMintLimitArgs>;
  edition: OptionOrNullable<EditionArgs>;
  assetPayment: OptionOrNullable<AssetPaymentArgs>;
  assetBurn: OptionOrNullable<AssetBurnArgs>;
  assetMintLimit: OptionOrNullable<AssetMintLimitArgs>;
  assetBurnMulti: OptionOrNullable<AssetBurnMultiArgs>;
  assetPaymentMulti: OptionOrNullable<AssetPaymentMultiArgs>;
  assetGate: OptionOrNullable<AssetGateArgs>;
  vanityMint: OptionOrNullable<VanityMintArgs>;
};

/**
 * The data for all default Candy Machine guards.
 */
export type DefaultGuardSet = GuardSet & {
  botTax: Option<BotTax>;
  solPayment: Option<SolPayment>;
  tokenPayment: Option<TokenPayment>;
  startDate: Option<StartDate>;
  thirdPartySigner: Option<ThirdPartySigner>;
  tokenGate: Option<TokenGate>;
  gatekeeper: Option<Gatekeeper>;
  endDate: Option<EndDate>;
  allowList: Option<AllowList>;
  mintLimit: Option<MintLimit>;
  nftPayment: Option<NftPayment>;
  redeemedAmount: Option<RedeemedAmount>;
  addressGate: Option<AddressGate>;
  nftGate: Option<NftGate>;
  nftBurn: Option<NftBurn>;
  tokenBurn: Option<TokenBurn>;
  freezeSolPayment: Option<FreezeSolPayment>;
  freezeTokenPayment: Option<FreezeTokenPayment>;
  programGate: Option<ProgramGate>;
  allocation: Option<Allocation>;
  token2022Payment: Option<Token2022Payment>;
  solFixedFee: Option<SolFixedFee>;
  nftMintLimit: Option<NftMintLimit>;
  edition: Option<Edition>;
  assetPayment: Option<AssetPayment>;
  assetBurn: Option<AssetBurn>;
  assetMintLimit: Option<AssetMintLimit>;
  assetBurnMulti: Option<AssetBurnMulti>;
  assetPaymentMulti: Option<AssetPaymentMulti>;
  assetGate: Option<AssetGate>;
  vanityMint: Option<VanityMint>;
};

/**
 * The mint arguments for all default Candy Machine guards.
 */
export type DefaultGuardSetMintArgs = GuardSetMintArgs & {
  // botTax: no mint settings
  solPayment: OptionOrNullable<SolPaymentMintArgs>;
  tokenPayment: OptionOrNullable<TokenPaymentMintArgs>;
  // startDate: no mint settings
  thirdPartySigner: OptionOrNullable<ThirdPartySignerMintArgs>;
  tokenGate: OptionOrNullable<TokenGateMintArgs>;
  gatekeeper: OptionOrNullable<GatekeeperMintArgs>;
  // endDate: no mint settings
  allowList: OptionOrNullable<AllowListMintArgs>;
  mintLimit: OptionOrNullable<MintLimitMintArgs>;
  nftPayment: OptionOrNullable<NftPaymentMintArgs>;
  // redeemedAmount: no mint settings
  // addressGate: no mint settings
  nftGate: OptionOrNullable<NftGateMintArgs>;
  nftBurn: OptionOrNullable<NftBurnMintArgs>;
  tokenBurn: OptionOrNullable<TokenBurnMintArgs>;
  freezeSolPayment: OptionOrNullable<FreezeSolPaymentMintArgs>;
  freezeTokenPayment: OptionOrNullable<FreezeTokenPaymentMintArgs>;
  // programGate: no mint settings
  allocation: OptionOrNullable<AllocationMintArgs>;
  token2022Payment: OptionOrNullable<Token2022PaymentMintArgs>;
  solFixedFee: OptionOrNullable<SolFixedFeeMintArgs>;
  nftMintLimit: OptionOrNullable<NftMintLimitMintArgs>;
  // edition: no mint settings
  assetPayment: OptionOrNullable<AssetPaymentMintArgs>;
  assetBurn: OptionOrNullable<AssetBurnMintArgs>;
  assetMintLimit: OptionOrNullable<AssetMintLimitMintArgs>;
  assetBurnMulti: OptionOrNullable<AssetBurnMultiMintArgs>;
  assetPaymentMulti: OptionOrNullable<AssetPaymentMultiMintArgs>;
  assetGate: OptionOrNullable<AssetGateMintArgs>;
};

/**
 * The route arguments for all default Candy Machine guards.
 */
export type DefaultGuardSetRouteArgs = GuardSetRouteArgs & {
  // botTax: no route settings
  // solPayment: no route settings
  // tokenPayment: no route settings
  // startDate: no route settings
  // thirdPartySigner: no route settings
  // tokenGate: no route settings
  // gatekeeper: no route settings
  // endDate: no route settings
  allowList: AllowListRouteArgs;
  // mintLimit: no route settings
  // nftPayment: no route settings
  // redeemedAmount: no route settings
  // addressGate: no route settings
  // nftGate: no route settings
  // nftBurn: no route settings
  // tokenBurn: no route settings
  freezeSolPayment: FreezeSolPaymentRouteArgs;
  freezeTokenPayment: FreezeTokenPaymentRouteArgs;
  // programGate: no route settings
  allocation: AllocationRouteArgs;
  // token2022Payment: no route settings
};

/** @internal */
export const defaultCandyGuardNames: string[] = [
  'botTax',
  'solPayment',
  'tokenPayment',
  'startDate',
  'thirdPartySigner',
  'tokenGate',
  'gatekeeper',
  'endDate',
  'allowList',
  'mintLimit',
  'nftPayment',
  'redeemedAmount',
  'addressGate',
  'nftGate',
  'nftBurn',
  'tokenBurn',
  'freezeSolPayment',
  'freezeTokenPayment',
  'programGate',
  'allocation',
  'token2022Payment',
  'solFixedFee',
  'nftMintLimit',
  'edition',
  'assetPayment',
  'assetBurn',
  'assetMintLimit',
  'assetBurnMulti',
  'assetPaymentMulti',
  'assetGate',
  'vanityMint',
];

/** @internal */
export const emptyDefaultGuardSetArgs: DefaultGuardSetArgs =
  defaultCandyGuardNames.reduce((acc, name) => {
    acc[name] = none();
    return acc;
  }, {} as DefaultGuardSetArgs);
