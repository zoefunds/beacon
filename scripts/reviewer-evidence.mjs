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
    address: "0x9D9AeA8B2B3586AC4B5e36a1B7f646689C3dfa44",
    network: "GenLayer Studionet",
    chainId: 61999,
    deploymentTransaction: "0xb2a9fb59c2ba02dd11f58e577aa189d0e617688a46293bf94b35494a0e9d376a",
    sourceBytes: contract.length,
    sourceSha256: createHash("sha256").update(contract).digest("hex"),
  },
  frontend: {
    productionUrl: "https://bea-con.vercel.app/",
    deploymentId: "dpl_6YEoehRyiKWbUuqxnP9PtUXyZ5TW",
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
  liveRelease1: {
    repo: "octocat/Spoon-Knife",
    commit: "d0dd1f61b33d64e29d8bc1372a94ef6a2fee76a9",
    state: "REVIEW",
    outcome: "INDETERMINATE",
    coverage: [1, 1, 1, 1, 0, 0],
    blockers: [],
    refundUnlockUnix: 1793617259,
    transactions: {
      openRelease: "0x45d6268f570fd120d2594ac89e2eec7831afed336aa7a710933112add5793097",
      seal: "0x8133a445efb0405283c488e08ed1cb71eea6722d43bcde29ecb5cb1dfc0a36cd",
      beginInventory: "0x84411ce81ec40436f70f269e8d24d1a4791c021a93a69e6afe2e5ba28319a944",
      discoverInventory: "0x1c5c78beebbadd67d823e5a5aa78ea725bcdaecb73928752298b2028c10a1464",
      closeInventory: "0xdcb1f428650ea363fd6909a8db42a2da6248a73bc8340721f3417dd96b52165b",
      materialize: "0x7857348eaea4e3a3de0bfc95d06dd5381c24af79e05f84a0363bd0546d96a22b",
      buildReviewGraph: "0x348a2389439c44001b82d8253b0724e3417e128395592efaf919f7f811c0d738",
      assessComponent: "0xbdda39c7df2b341e5d7adb6ef8ad5a5a2f3efcb2b2a28ea79f631d6b71635396",
      proposeCertificate: "0xe20e354c3ae1de6fc1c6c7c9b70dedd16b2133dca2398c3b37505ac3e3edbc8e",
    },
  },
};

console.log(JSON.stringify(evidence, null, 2));
