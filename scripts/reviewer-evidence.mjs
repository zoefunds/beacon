import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const run = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const contract = readFileSync(new URL("../contract/contracts/beacon.py", import.meta.url));

const evidence = {
  generatedAt: new Date().toISOString(),
  repository: "https://github.com/zoefunds/beacon",
  commit: run("rev-parse", "HEAD"),
  frontendTree: run("rev-parse", "HEAD:frontend"),
  contract: {
    address: "0x48629d95C2b1e51790d12b3E55108e5902727D4c",
    network: "GenLayer Studionet",
    chainId: 61999,
    deploymentTransaction: "0xce6f6c496d144c1fdd6f8134ab45d4cff7081913b0c78e04881058565ecfa8d0",
    sourceBytes: contract.length,
    sourceSha256: createHash("sha256").update(contract).digest("hex"),
  },
  frontend: {
    productionUrl: "https://bea-con.vercel.app/",
    deploymentId: "dpl_CnCy9Wbyus4StJBV2YTDyn3KU4Ei",
    attestationLog: "https://bea-con.vercel.app/attestations?release=1",
    vault: "https://bea-con.vercel.app/vault",
  },
  verificationCommands: [
    "npm ci",
    "npm --prefix frontend ci",
    "python -m pip install -r contract/requirements.txt",
    "npm run check",
    "genvm-lint contract/contracts/beacon.py",
    "npm --prefix frontend audit --omit=dev",
    "npm run evidence",
    "npm run evidence:live",
    "npm run evidence:frontend",
  ],
  liveSettlementRelease1: {
    repo: "octocat/Spoon-Knife",
    commit: "d0dd1f61b33d64e29d8bc1372a94ef6a2fee76a9",
    state: "EXPIRED",
    escrowWei: "1000000000000000000",
    sealDeadlineUnix: 1793016000,
    finalContractCreditWei: "0",
    finalWalletWei: "1000000000000000000",
    transactions: {
      openRelease: "0x35316f278f9afe08dc1ac761c36af4cc0440c517329d4a9f49fa62642f13e5a7",
      expireUnsealed: "0xb6fc86601e4fa1ea931e0acb270994d9c4ece7d7324a60ffc90c84b1d5e92330",
      withdraw: "0x53de362f8923ff6eb437798f03603b9644d693fc9c1c9bee3122cdc019153024",
      transfer: "0xca18a8edef2b44b93368b0ad6f6b7fefc3b6b86d78669b7a5ff2438e0fddf31d",
      secondWithdraw: "0x5080326c39e89f87bb9b7c20d3b65786a78abb5022d3a2ce479dcb61133c7674",
    },
  },
  nondeterministicConsensusReference: {
    contract: "0x9D9AeA8B2B3586AC4B5e36a1B7f646689C3dfa44",
    assessComponent: "0xbdda39c7df2b341e5d7adb6ef8ad5a5a2f3efcb2b2a28ea79f631d6b71635396",
    proposeCertificate: "0xe20e354c3ae1de6fc1c6c7c9b70dedd16b2133dca2398c3b37505ac3e3edbc8e",
  },
};

console.log(JSON.stringify(evidence, null, 2));
