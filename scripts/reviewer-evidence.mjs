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
    attestationLog: "https://bea-con.vercel.app/attestations?release=2",
    vault: "https://bea-con.vercel.app/vault",
  },
  verificationCommands: [
    "npm ci",
    "npm --prefix frontend ci",
    "python3 -m venv .venv",
    ".venv/bin/python -m pip install -r contract/requirements.txt",
    "npm run check",
    "genvm-lint contract/contracts/beacon.py",
    "npm --prefix frontend audit --omit=dev",
    "npm run evidence",
    "npm run evidence:live",
    "npm run evidence:frontend",
    "npm run evidence:public",
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
  liveCertificateRelease2: {
    repo: "octocat/Spoon-Knife",
    baseline: "d0dd1f61b33d64e29d8bc1372a94ef6a2fee76a9",
    sealedCommit: "d0dd1f61b33d64e29d8bc1372a94ef6a2fee76a9",
    sealedTree: "d7cee29eaada459ba458a63ad983a89915c6a10a",
    scope: ["index.html"],
    outcome: "REJECTED",
    coverage: [1, 1, 1, 1, 0, 0],
    escrowWei: "1000000000000000000",
    transactions: {
      openRelease: "0x1e6b5314982df60b9c6c3a2021a9d74a0695a7ce2fac6c0d92fc1bbd0f3c3b8f",
      sealRelease: "0xac65cc9c8e2994bb39972875b1f79b4e243b783e365a06975d174cdb41a625e3",
      blockedLateSubstitution: "0x8cc278f31a1cf5dad4858c5c7485e6be87e0f0c07681dbce1342b3fa35b0c0ae",
      beginInventory: "0xd46990ee217d1bc3182ef7d91738534dd1ad3d31ba6b9e1fd2606fa5583c8c9d",
      discoverInventory: "0x23873975ab69e61d5e5d66688df67bc7b5575e7d0abec5b7ec43f40ef221c518",
      closeInventory: "0xbb02452e7450995c1ed5144750045ec8f955fb370d73c5ed1109275ddff6be06",
      materialize: "0x124ad12772063d6aec70c17384ea3fd4b3b298d43c90a17f62887d64d8a150a6",
      buildGraph: "0xb8d7e02764054edb31b5577aa90dc71806bedec2347d5cffcc56fe19d23fae96",
      assessComponent: "0x2f82fbb82394976a208c28f9cbc761292d365f7987a2ca49b8fbc352dd7627b2",
      proposeCertificate: "0x8c13f4d0919a1107c64324ad7e9bc561e74a637146f45f834ac649951eaf95de",
      finalize: "0xf60399d05baef7c75c5cd544dffff0576d45683c20de2faee8cc74c749e61c17",
      blockedDuplicateFinalize: "0x7b29cadfe3b0d7215db67db4f205dec5053494a61331f09c585513a9bab5b795",
      withdraw: "0x431b31750e068e77740978dbb82c3d392862aad372f45782fd9d277a44634190",
      transfer: "0xe15f2996e6def7199ab0bd5fc1fb83b20b6e85a7be30b298478f40f9ae8908aa",
      secondWithdraw: "0xaa1b25028cf9b2989113c5c9f01375fbc693a9d6c6859bcff81003ffef3cf3fb",
    },
  },
};

console.log(JSON.stringify(evidence, null, 2));
