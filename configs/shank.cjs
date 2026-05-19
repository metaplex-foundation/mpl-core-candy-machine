const path = require("path");
const fs = require("fs");
const { generateIdl } = require("@metaplex-foundation/shank-js");

const idlDir = path.join(__dirname, "..", "idls");
const binaryInstallDir = path.join(__dirname, "..", ".crates");
const programDir = path.join(__dirname, "..", "programs");

// Anchor 0.30's IDL build relies on nightly-only proc macro span APIs.
process.env.RUSTUP_TOOLCHAIN ??= "nightly-2024-06-01";

function normalizeDefinedTypes(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeDefinedTypes);
  }

  if (value === "pubkey") {
    return "publicKey";
  }

  if (value !== null && typeof value === "object") {
    if (
      value.defined !== null &&
      typeof value.defined === "object" &&
      typeof value.defined.name === "string" &&
      (!value.defined.generics || value.defined.generics.length === 0)
    ) {
      return {
        ...value,
        defined: value.defined.name,
      };
    }

    const normalized = Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        normalizeDefinedTypes(child),
      ])
    );

    if ("writable" in normalized) {
      normalized.isMut = normalized.writable;
      delete normalized.writable;
    }

    if ("signer" in normalized) {
      normalized.isSigner = normalized.signer;
      delete normalized.signer;
    }

    if ("optional" in normalized) {
      normalized.isOptional = normalized.optional;
      delete normalized.optional;
    }

    return normalized;
  }

  return value;
}

function readIdl(programName) {
  const idlPath = path.join(idlDir, `${programName}.json`);
  if (!fs.existsSync(idlPath)) {
    return undefined;
  }

  return JSON.parse(fs.readFileSync(idlPath, "utf8"));
}

function mergeLegacyAccountDefinitions(idl, previousIdl) {
  const typesByName = new Map((idl.types ?? []).map((type) => [type.name, type]));
  const previousAccountsByName = new Map(
    (previousIdl?.accounts ?? []).map((account) => [account.name, account])
  );

  const accounts = (idl.accounts ?? [])
    .map((account) => {
      const type = typesByName.get(account.name);
      if (!type) {
        return account;
      }

      typesByName.delete(account.name);
      return {
        name: account.name,
        docs: type.docs ?? [],
        type: type.type,
      };
    })
    .filter(
      (account) =>
        previousAccountsByName.size === 0 || previousAccountsByName.has(account.name)
    );

  const accountsByName = new Map(accounts.map((account) => [account.name, account]));
  for (const [name, account] of previousAccountsByName) {
    if (!accountsByName.has(name)) {
      accounts.push(account);
    }
  }

  const types = Array.from(typesByName.values());
  const typesByNameAfterAccounts = new Map(types.map((type) => [type.name, type]));
  for (const type of previousIdl?.types ?? []) {
    if (!typesByNameAfterAccounts.has(type.name)) {
      types.push(type);
    }
  }

  return {
    ...idl,
    accounts,
    types,
  };
}

function normalizeIdl(programName, previousIdl) {
  const idlPath = path.join(idlDir, `${programName}.json`);
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
  idl.name ??= idl.metadata?.name;
  idl.version ??= idl.metadata?.version;
  const normalizedIdl = mergeLegacyAccountDefinitions(
    normalizeDefinedTypes(idl),
    previousIdl
  );
  fs.writeFileSync(
    idlPath,
    `${JSON.stringify(normalizedIdl, null, 2)}\n`
  );
}

async function main() {
  const previousCandyMachineCoreIdl = readIdl("candy_machine_core");
  const previousCandyGuardIdl = readIdl("candy_guard");

  await generateIdl({
    generator: "anchor",
    programName: "candy_machine_core",
    programId: "CMACYFENjoBMHzapRXyo1JZkVS6EtaDDzkjMrmQLvr4J",
    idlDir,
    binaryInstallDir,
    programDir: path.join(programDir, "candy-machine-core", "program"),
    rustbin: {
      locked: true,
      versionRangeFallback: "0.27.0",
    },
  });
  normalizeIdl("candy_machine_core", previousCandyMachineCoreIdl);

  await generateIdl({
    generator: "anchor",
    programName: "candy_guard",
    programId: "CMAGAKJ67e9hRZgfC5SFTbZH8MgEmtqazKXjmkaJjWTJ",
    idlDir,
    binaryInstallDir,
    programDir: path.join(programDir, "candy-guard", "program"),
    rustbin: {
      locked: true,
      versionRangeFallback: "0.27.0",
    },
  });
  normalizeIdl("candy_guard", previousCandyGuardIdl);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
