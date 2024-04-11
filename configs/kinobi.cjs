const path = require("path");
const k = require("@metaplex-foundation/kinobi");

// Paths.
const clientDir = path.join(__dirname, "..", "clients");
const idlDir = path.join(__dirname, "..", "idls");

// Instanciate Kinobi.
const kinobi = k.createFromIdls([
  path.join(idlDir, "candy_machine_core.json"),
  path.join(idlDir, "candy_guard.json"),
]);

// Update programs.
kinobi.update(
  new k.UpdateProgramsVisitor({
    candyGuard: { name: "mplCoreCandyGuard", prefix: "Cg" },
    candyMachineCore: { name: "mplCoreCandyMachineCore", prefix: "Cm" },
  })
);

// Transform some defined types into accounts.
kinobi.update(
  new k.TransformDefinedTypesIntoAccountsVisitor([
    "mintCounter",
    "allowListProof",
    "allocationTracker",
    "nftMintCounter",
  ])
);

// Reusable seeds.
const candyGuardSeed = k.publicKeySeed(
  "candyGuard",
  "The address of the Candy Guard account"
);
const candyMachineSeed = k.publicKeySeed(
  "candyMachine",
  "The address of the Candy Machine account"
);
const userSeed = k.publicKeySeed(
  "user",
  "The address of the wallet trying to mint"
);

// Update accounts.
kinobi.update(
  new k.UpdateAccountsVisitor({
    candyGuard: {
      internal: true,
      seeds: [
        k.stringConstantSeed("candy_guard"),
        k.publicKeySeed(
          "base",
          "The base address which the Candy Guard PDA derives from"
        ),
      ],
    },
    mintCounter: {
      size: 2,
      discriminator: k.sizeAccountDiscriminator(),
      seeds: [
        k.stringConstantSeed("mint_limit"),
        k.variableSeed(
          "id",
          k.numberTypeNode("u8"),
          "A unique identifier in the context of a Candy Machine/Candy Guard combo"
        ),
        userSeed,
        candyGuardSeed,
        candyMachineSeed,
      ],
    },
    allowListProof: {
      size: 8,
      discriminator: k.sizeAccountDiscriminator(),
      seeds: [
        k.stringConstantSeed("allow_list"),
        k.variableSeed(
          "merkleRoot",
          k.bytesTypeNode(k.fixedSize(32)),
          "The Merkle Root used when verifying the user"
        ),
        userSeed,
        candyGuardSeed,
        candyMachineSeed,
      ],
    },
    freezeEscrow: {
      seeds: [
        k.stringConstantSeed("freeze_escrow"),
        k.publicKeySeed(
          "destination",
          "The wallet that will eventually receive the funds"
        ),
        candyGuardSeed,
        candyMachineSeed,
      ],
    },
    allocationTracker: {
      size: 4,
      discriminator: k.sizeAccountDiscriminator(),
      seeds: [
        k.stringConstantSeed("allocation"),
        k.variableSeed(
          "id",
          k.numberTypeNode("u8"),
          "Unique identifier of the allocation"
        ),
        candyGuardSeed,
        candyMachineSeed,
      ],
    },
    nftMintCounter: {
      size: 2,
      discriminator: k.sizeAccountDiscriminator(),
      seeds: [
        k.stringConstantSeed("nft_mint_limit"),
        k.variableSeed(
          "id",
          k.numberTypeNode("u8"),
          "A unique identifier in the context of a NFT mint/Candy Machine/Candy Guard combo"
        ),
        k.publicKeySeed("mint", "The address of the NFT mint"),
        candyGuardSeed,
        candyMachineSeed,
      ],
    },
  })
);

// Update defined types.
kinobi.update(
  new k.UpdateDefinedTypesVisitor({
    candyGuardData: { delete: true },
    guardSet: { delete: true },
    group: { delete: true },
  })
);

// Update fields.
kinobi.update(
  new k.TransformNodesVisitor([
    {
      selector: { kind: "linkTypeNode", name: "pluginAuthorityPair" },
      transformer: (node) => {
        return k.linkTypeNode(
          "pluginAuthorityPair", {
          importFrom: "@metaplex-foundation/mpl-core",
        });
      },
    },
    {
      selector: { type: "structFieldTypeNode", name: "maxSupply" },
      transformer: (node) => {
        return k.structFieldTypeNode({ ...node, name: "maxEditionSupply" });
      },
    },
    {
      selector: { type: "structFieldTypeNode", name: "hash" },
      transformer: (node) => {
        return k.structFieldTypeNode({
          ...node,
          child: k.bytesTypeNode(k.fixedSize(32)),
        });
      },
    },
    {
      selector: { type: "structFieldTypeNode", name: "merkleRoot" },
      transformer: (node) => {
        return k.structFieldTypeNode({
          ...node,
          child: k.bytesTypeNode(k.fixedSize(32)),
        });
      },
    },
  ])
);

// Reusable PDA defaults.
const defaultsToAssociatedTokenPda = (mint = "mint", owner = "owner") =>
  k.pdaDefault("associatedToken", {
    importFrom: "mplEssentials",
    seeds: { mint: k.accountDefault(mint), owner: k.accountDefault(owner) },
  });
const defaultsToCandyGuardPda = (base = "base") =>
  k.pdaDefault("candyGuard", {
    importFrom: "hooked",
    seeds: { base: k.accountDefault(base) },
  });
const defaultsToCandyMachineAuthorityPda = (candyMachine = "candyMachine") =>
  k.pdaDefault("candyMachineAuthority", {
    importFrom: "hooked",
    seeds: { candyMachine: k.accountDefault(candyMachine) },
  });
const defaultsToMetadataPda = (mint = "mint") =>
  k.pdaDefault("metadata", {
    importFrom: "mplTokenMetadata",
    seeds: { mint: k.accountDefault(mint) },
  });
const defaultsToMasterEditionPda = (mint = "mint") =>
  k.pdaDefault("masterEdition", {
    importFrom: "mplTokenMetadata",
    seeds: { mint: k.accountDefault(mint) },
  });
const defaultsToCollectionAuthorityRecordPda = (
  mint = "mint",
  collectionAuthority = "collectionAuthority"
) =>
  k.pdaDefault("collectionAuthorityRecord", {
    importFrom: "mplTokenMetadata",
    seeds: {
      mint: k.accountDefault(mint),
      collectionAuthority: k.accountDefault(collectionAuthority),
    },
  });
const defaultsToMetadataDelegateRecordPda = (
  role = "Collection",
  mint = "mint",
  updateAuthority = "updateAuthority",
  delegate = "delegate"
) =>
  k.pdaDefault("metadataDelegateRecord", {
    importFrom: "mplTokenMetadata",
    seeds: {
      mint: k.accountDefault(mint),
      delegateRole: k.valueDefault(
        k.vEnum("metadataDelegateRole", role, null, "mplTokenMetadata")
      ),
      updateAuthority: k.accountDefault(updateAuthority),
      delegate: k.accountDefault(delegate),
    },
  });
const defaultsToSplAssociatedTokenProgram = () =>
  k.programDefault(
    "splAssociatedToken",
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
  );

const defaultsToCandyMachineAssetProgram = () =>
  k.programDefault(
    "mplCandyMachine",
    "CMACYFENjoBMHzapRXyo1JZkVS6EtaDDzkjMrmQLvr4J"
  );

const defaultsToMplCoreProgram = () =>
  k.programDefault(
    "mplCore",
    "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
  );

// Automatically recognize account default values.
kinobi.update(
  new k.SetInstructionAccountDefaultValuesVisitor([
    {
      ...defaultsToMplCoreProgram(),
      account: "mplCoreProgram",
      ignoreIfOptional: true,
    },
    {
      ...k.publicKeyDefault("SysvarS1otHashes111111111111111111111111111"),
      account: /^recentSlothashes$/,
      ignoreIfOptional: true,
    },
    {
      ...k.identityDefault(),
      account: "candyMachineAuthority",
      ignoreIfOptional: true,
    },
    {
      ...defaultsToCandyMachineAuthorityPda(),
      account: "authorityPda",
      ignoreIfOptional: true,
    },
    {
      ...defaultsToCandyMachineAuthorityPda(),
      account: "candyMachineAuthorityPda",
      ignoreIfOptional: true,
    },
    {
      ...defaultsToMetadataPda("collectionMint"),
      account: "collectionMetadata",
      ignoreIfOptional: true,
    },
    {
      ...defaultsToMetadataPda("newCollectionMint"),
      account: "newCollectionMetadata",
      ignoreIfOptional: true,
    },
    {
      ...defaultsToMetadataPda("nftMint"),
      account: "nftMetadata",
      ignoreIfOptional: true,
    },
    {
      ...defaultsToMasterEditionPda("collectionMint"),
      account: "collectionMasterEdition",
      ignoreIfOptional: true,
    },
    {
      ...defaultsToMasterEditionPda("newCollectionMint"),
      account: "newCollectionMasterEdition",
      ignoreIfOptional: true,
    },
    {
      ...defaultsToMasterEditionPda("nftMint"),
      account: "nftMasterEdition",
      ignoreIfOptional: true,
    },
    {
      ...defaultsToCollectionAuthorityRecordPda(
        "collectionMint",
        "authorityPda"
      ),
      account: "collectionAuthorityRecord",
      ignoreIfOptional: true,
    },
    {
      ...defaultsToCollectionAuthorityRecordPda(
        "newCollectionMint",
        "authorityPda"
      ),
      account: "newCollectionAuthorityRecord",
      ignoreIfOptional: true,
    },
    {
      ...defaultsToMetadataDelegateRecordPda(
        "collection",
        "collectionMint",
        "collectionUpdateAuthority",
        "authorityPda"
      ),
      account: "collectionDelegateRecord",
      ignoreIfOptional: true,
    },
  ])
);

// Update instructions.
kinobi.update(
  new k.UpdateInstructionsVisitor({
    "mplCoreCandyGuard.initialize": {
      name: "createCandyGuard",
      internal: true,
      accounts: {
        candyGuard: {
          defaultsTo: k.pdaDefault("candyGuard", { importFrom: "hooked" }),
        },
      },
    },
    "mplCoreCandyMachineCore.initialize": {
      name: "initializeCandyMachine",
    },
    "mplCoreCandyMachineCore.mintAsset": {
      name: "mintAssetFromCandyMachine",
      args: {
        plugins: {
          defaultsTo: k.valueDefault(k.vList([]))
        }
      },
      accounts: {
        asset: { isSigner: "either" },
        mplCoreProgram: {
          defaultsTo: defaultsToMplCoreProgram(),
        },
        sysvarInstructions: {
          defaultsTo: k.publicKeyDefault(
            "Sysvar1nstructions1111111111111111111111111"
          ),
        },
      },
    },
    "mplCoreCandyGuard.wrap": {
      accounts: {
        candyMachineProgram: { defaultsTo: defaultsToCandyMachineAssetProgram() },
      }
    },
    "mplCoreCandyGuard.unwrap": {
      accounts: {
        candyMachineProgram: { defaultsTo: defaultsToCandyMachineAssetProgram() },
      }
    },
    "mplCoreCandyGuard.mintV1": {
      internal: true,
      args: {
        label: { name: "group" },
      },
      accounts: {
        candyGuard: { defaultsTo: defaultsToCandyGuardPda("candyMachine") },
        asset: { isSigner: "either" },
        minter: { defaultsTo: k.identityDefault() },

        splAtaProgram: { defaultsTo: defaultsToSplAssociatedTokenProgram() },
        candyMachineProgram: { defaultsTo: defaultsToCandyMachineAssetProgram() },
      },
    },
    "mplCoreCandyGuard.route": {
      internal: true,
      args: {
        label: { name: "group" },
      },
      accounts: {
        candyGuard: { defaultsTo: defaultsToCandyGuardPda("candyMachine") },
        candyMachineProgram: { defaultsTo: defaultsToCandyMachineAssetProgram() },
      },
    },
    "mplCoreCandyMachineCore.setCollection": {
      accounts: {
        newCollectionDelegateRecord: {
          defaultsTo: defaultsToMetadataDelegateRecordPda(
            "collection",
            "newCollectionMint",
            "newCollectionUpdateAuthority",
            "authorityPda"
          ),
        },
      },
    },
    "mplCoreCandyMachineCore.SetAuthority": { name: "SetCandyMachineAuthority" },
    "mplCoreCandyGuard.SetAuthority": { name: "SetCandyGuardAuthority" },
    "mplCoreCandyMachineCore.update": { name: "updateCandyMachine" },
    "mplCoreCandyGuard.update": { name: "updateCandyGuard", internal: true },
    "mplCoreCandyMachineCore.withdraw": { name: "deleteCandyMachine" },
    "mplCoreCandyGuard.withdraw": { name: "deleteCandyGuard" },
  })
);

// Unwrap candyMachineData defined type but only for initialize instructions.
kinobi.update(
  new k.UnwrapTypeDefinedLinksVisitor([
    "initializeCandyMachine.candyMachineData",
  ])
);
kinobi.update(new k.FlattenInstructionArgsStructVisitor());

// Set struct default values.
const defaultInitialCandyMachineData = {
  maxEditionSupply: k.vScalar(0),
  isMutable: k.vScalar(true),
  configLineSettings: k.vNone(),
  hiddenSettings: k.vNone(),
  editionStartingNumber: k.vNone()
};
kinobi.update(
  new k.SetStructDefaultValuesVisitor({
    initializeCandyMachineInstructionData: defaultInitialCandyMachineData,
  })
);

// Wrap numbers.
const percentAmount = { kind: "Amount", identifier: "%", decimals: 2 };
kinobi.update(
  new k.SetNumberWrappersVisitor({
    "candyMachineData.sellerFeeBasisPoints": percentAmount,
    "initializeCandyMachineInstructionData.sellerFeeBasisPoints": percentAmount,
    "startDate.date": { kind: "DateTime" },
    "endDate.date": { kind: "DateTime" },
    "botTax.lamports": { kind: "SolAmount" },
    "solPayment.lamports": { kind: "SolAmount" },
    "freezeSolPayment.lamports": { kind: "SolAmount" },
    "solFixedFee.lamports": { kind: "SolAmount" },
  })
);

// Custom serializers.
kinobi.update(
  new k.UseCustomAccountSerializerVisitor({
    candyMachine: { extract: true },
  })
);

// Render JavaScript.
const jsDir = path.join(clientDir, "js", "src", "generated");
kinobi.accept(
  new k.RenderJavaScriptVisitor(jsDir, {
    prettier: require(path.join(clientDir, "js", ".prettierrc.json")),
    dependencyMap: {
      mplTokenMetadata: "@metaplex-foundation/mpl-token-metadata",
    },
  })
);
