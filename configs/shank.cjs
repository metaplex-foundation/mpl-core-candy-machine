const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");
const { generateIdl } = require("@metaplex-foundation/shank-js");

const idlDir = path.join(__dirname, "..", "idls");
const binaryInstallDir = path.join(__dirname, "..", ".crates");
const programDir = path.join(__dirname, "..", "programs");
const programs = [
  {
    name: "candy_machine_core",
    id: "CMACYFENjoBMHzapRXyo1JZkVS6EtaDDzkjMrmQLvr4J",
    path: path.join(programDir, "candy-machine-core", "program"),
  },
  {
    name: "candy_guard",
    id: "CMAGAKJ67e9hRZgfC5SFTbZH8MgEmtqazKXjmkaJjWTJ",
    path: path.join(programDir, "candy-guard", "program"),
  },
];

function ensureAnchorCli() {
  const anchorPath = path.join(binaryInstallDir, "bin", "anchor");
  if (!fs.existsSync(anchorPath)) {
    execFileSync("cargo", ["install", "--root", binaryInstallDir, "--locked", "anchor-cli@0.30.1"], {
      stdio: "inherit",
    });
  }
}

ensureAnchorCli();
process.env.RUSTUP_TOOLCHAIN ??= "nightly-2024-06-01";

function normalizeIdlTypes(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeIdlTypes);
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
      Object.entries(value).map(([key, child]) => [key, normalizeIdlTypes(child)])
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
  return fs.existsSync(idlPath)
    ? JSON.parse(fs.readFileSync(idlPath, "utf8"))
    : undefined;
}

function normalizeAccounts(idl, previousIdl) {
  const typesByName = new Map((idl.types ?? []).map((type) => [type.name, type]));
  const previousAccountNames = new Set((previousIdl?.accounts ?? []).map((account) => account.name));

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
    .filter((account) => previousAccountNames.size === 0 || previousAccountNames.has(account.name));

  const accountNames = new Set(accounts.map((account) => account.name));
  for (const account of previousIdl?.accounts ?? []) {
    if (!accountNames.has(account.name)) {
      accounts.push(account);
    }
  }

  const types = Array.from(typesByName.values());
  const typeNames = new Set(types.map((type) => type.name));
  for (const type of previousIdl?.types ?? []) {
    if (!typeNames.has(type.name)) {
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
  fs.writeFileSync(
    idlPath,
    `${JSON.stringify(normalizeAccounts(normalizeIdlTypes(idl), previousIdl), null, 2)}\n`
  );
}

async function main() {
  for (const program of programs) {
    const previousIdl = readIdl(program.name);
    await generateIdl({
      generator: "anchor",
      programName: program.name,
      programId: program.id,
      idlDir,
      binaryInstallDir,
      programDir: program.path,
      rustbin: {
        locked: true,
        versionRangeFallback: "0.27.0",
      },
    });
    normalizeIdl(program.name, previousIdl);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
