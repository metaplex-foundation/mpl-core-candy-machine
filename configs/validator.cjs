const path = require("path");

const programDir = path.join(__dirname, "..", "programs");

function getProgram(programName) {
  return path.join(programDir, ".bin", programName);
}

module.exports = {
  validator: {
    commitment: "processed",
    accountsCluster: "https://api.devnet.solana.com",
    programs: [
      {
        label: "MPL Core",
        programId: "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d",
        deployPath: getProgram("mpl_core_program.so"),
      },
      {
        label: "Candy Machine Core Asset",
        programId: "CMACYFENjoBMHzapRXyo1JZkVS6EtaDDzkjMrmQLvr4J",
        deployPath: getProgram("mpl_core_candy_machine_core.so"),
      },
      {
        label: "Candy Guard Asset",
        programId: "CMAGAKJ67e9hRZgfC5SFTbZH8MgEmtqazKXjmkaJjWTJ",
        deployPath: getProgram("mpl_core_candy_guard.so"),
      },
      {
        label: "Token Metadata",
        programId: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
        deployPath: getProgram("mpl_token_metadata.so"),
      },
      {
        label: "Token Auth Rules",
        programId: "auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg",
        deployPath: getProgram("mpl_token_auth_rules.so"),
      },
      {
        label: "System Extras",
        programId: "SysExL2WDyJi9aRZrXorrjHJut3JwHQ7R9bTyctbNNG",
        deployPath: getProgram("mpl_system_extras.so"),
      },
      {
        label: "Token Extras",
        programId: "TokExjvjJmhKaRBShsBAsbSvEWMA1AgUNK7ps4SAc2p",
        deployPath: getProgram("mpl_token_extras.so"),
      },
      {
        label: "Civic Gateway",
        programId: "gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs",
        deployPath: getProgram("civic_gateway.so"),
      },
      {
        label: "SPL Token 2022",
        programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        deployPath: getProgram("spl_token_2022.so"),
      },
    ],
    accounts: [
      {
        label: "Metaplex Default RuleSet",
        accountId: "eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9",
        executable: false,
      },
    ],
  },
};
