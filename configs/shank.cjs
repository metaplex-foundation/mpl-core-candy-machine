const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");

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

function ensureAnchorCli() {
  if (installedAnchorVersion() === anchorVersion) return;
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
    { stdio: "inherit" }
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
