const path = require("path");
const fs = require("fs");
const { execFileSync, spawnSync } = require("child_process");

const idlDir = path.join(__dirname, "..", "idls");
const binaryInstallDir = path.join(__dirname, "..", ".crates");
const programDir = path.join(__dirname, "..", "programs");

// The programs use anchor-lang 0.30, but the clients are generated from the
// legacy IDL format. anchor-cli 0.29 parses that format straight from the
// source, so there is no SBF build, no `idl-build` feature and no nightly
// toolchain involved (and no `anchor build` rewriting `declare_id!`).
const anchorVersion = "0.29.0";
const anchorBin = path.join(binaryInstallDir, "bin", "anchor");

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

function installedAnchorVersion() {
  if (!fs.existsSync(anchorBin)) return undefined;
  return execFileSync(anchorBin, ["--version"], { encoding: "utf8" })
    .trim()
    .split(" ")
    .pop();
}

// anchor-cli 0.29's lockfile pins `time` 0.3.29, which does not compile on
// Rust 1.80+, so build it with the same toolchain CI uses for IDL generation.
function idlRustVersion() {
  const env = fs.readFileSync(path.join(__dirname, "..", ".github", ".env"), "utf8");
  return process.env.IDL_RUST_VERSION ?? env.match(/^IDL_RUST_VERSION=(.+)$/m)[1].trim();
}

// Without rustup the active toolchain is used, so it must predate 1.80.
function cargoEnv() {
  if (spawnSync("rustup", ["--version"], { stdio: "ignore" }).status === 0) {
    const toolchain = idlRustVersion();
    execFileSync("rustup", ["toolchain", "install", toolchain, "--profile", "minimal"], {
      stdio: "inherit",
    });
    return { ...process.env, RUSTUP_TOOLCHAIN: toolchain };
  }

  const rustc = execFileSync("rustc", ["--version"], { encoding: "utf8" }).trim();
  const [major, minor] = rustc.split(" ")[1].split(".").map(Number);
  if (major > 1 || minor >= 80) {
    throw new Error(
      `anchor-cli ${anchorVersion} does not build on ${rustc}; install Rust ${idlRustVersion()} (or rustup).`
    );
  }
  return process.env;
}

function ensureAnchorCli() {
  if (installedAnchorVersion() === anchorVersion) return;
  const env = cargoEnv();
  execFileSync(
    "cargo",
    [
      "install",
      "--root",
      binaryInstallDir,
      "--locked",
      "--force",
      "anchor-cli",
      "--version",
      anchorVersion,
    ],
    { stdio: "inherit", env }
  );
}

function anchorLangVersion(programPath) {
  const cargoToml = fs.readFileSync(path.join(programPath, "Cargo.toml"), "utf8");
  const match = cargoToml.match(/^anchor-lang\s*=\s*(?:"([^"]+)"|\{[^}]*version\s*=\s*"([^"]+)")/m);
  return match ? match[1] ?? match[2] : undefined;
}

ensureAnchorCli();

for (const program of programs) {
  const idlPath = path.join(idlDir, `${program.name}.json`);
  execFileSync(anchorBin, ["idl", "parse", "--file", "src/lib.rs", "--out", idlPath], {
    cwd: program.path,
    stdio: "inherit",
  });

  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
  idl.metadata = {
    ...idl.metadata,
    address: program.id,
    origin: "anchor",
    binaryVersion: anchorVersion,
    libVersion: anchorLangVersion(program.path),
  };
  fs.writeFileSync(idlPath, JSON.stringify(idl, null, 2));
  console.log(`Generated ${program.name} IDL at ${idlPath}.`);
}
