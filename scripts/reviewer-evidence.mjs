import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const source = readFileSync(new URL("../contract/contracts/beacon.py", import.meta.url));

console.log(JSON.stringify({
  generatedAt: new Date().toISOString(),
  repository: "https://github.com/zoefunds/beacon",
  commit: git("rev-parse", "HEAD"),
  frontendTree: git("rev-parse", "HEAD:frontend"),
  reviewTag: "reviewer-evidence-2026-10-27-v12",
  contract: {
    network: "GenLayer Studionet",
    chainId: 61999,
    address: "0x3244f824cD071D564071AD5ad8207953a0A04Efb",
    deploymentTransaction: "0xf5863c8d931f250430261570129a51ebb4f11c8251502b4c862ef4bc8497008c",
    sourceBytes: source.length,
    sourceSha256: createHash("sha256").update(source).digest("hex"),
  },
  frontend: {
    productionUrl: "https://bea-con.vercel.app/",
    immutableUrl: "https://bea-oq7tlnoeg-adebiyi2002gmailcoms-projects.vercel.app",
    deploymentId: "dpl_63hpRvuraJ8oPWmwCvHsk7g1ipsL",
    attestation: "https://bea-con.vercel.app/attestations",
    vault: "https://bea-con.vercel.app/vault",
  },
  historicalRelease1OnSupersededContract: {
    repository: "octocat/Spoon-Knife",
    commit: "d0dd1f61b33d64e29d8bc1372a94ef6a2fee76a9",
    tree: "d7cee29eaada459ba458a63ad983a89915c6a10a",
    scope: ["index.html"],
    escrowWei: "1000000000000000000",
    coverage: [1, 1, 1, 1, 0, 0],
    outcome: "ACCEPTED",
    transactions: {
      fundWallet: "0xf3e70c10ba21885a344bd96d4f72d45ad191b4ae02cc9c3085e23c7b9cc0387f",
      openRelease: "0x63033642e0a275c7602e4c6d7c7d4fa1418807045d7de9156481b3d2eb11334d",
      depositFunding: "0xdaec79cb143984d84b823833c0d9efc1b9a8686a7d07ede8eaf5828b57bcf75a",
      sponsor: "0xc9be84bc9bca571e935db8cb108891c0e787031d6d3cf257fe29cdd8411cf1a0",
      sealRelease: "0xfbf1ef4112996eb748dd227227131f1770e18ddd1711e172df81640303ca96ac",
      beginInventory: "0xbd0761afba5dcbc6c0cbf113fcc7adb30c2fbd69d7ad258b14d6b7f9298874ea",
      discoverInventory: "0xb420b89917f2eda7345864281cd89ca3ed474897328ce8cf48f17729995eb5b4",
      closeInventory: "0xfe2b17ab9f48491e503eff6959925fdb86c1e035e474e2edfb3305d43304f8e0",
      materialize: "0x56e6c1f71eb7905bb92b4b70d5191cd76de80a639b694e44d7168598d08bcaf5",
      buildGraph: "0x5396ece97ab2af9df413929459512303cd4afb884c10e542654bd3f67af9189e",
      assessComponent: "0xcefc8ac7d949fb345dfc35a82ebe0d02b11e89995c8721e0a231e17beadff2d2",
      proposeCertificate: "0xdc4f8e45fa67c429d95cd9a1ae0aa8a537e55d4c85c0bbd61ce6cebe9bbd3bcc",
      blockedPrematureFinalize: "0xce4a2ec175194e41331f83791e2bd1882343b85b4e017a4578a7e74cd17b983a",
      finalize: "0x2c0b51a43d925857cb171fa7ce996e67a0a3a3b6fbab9b6e235eba046f52b72a",
      blockedDuplicateFinalize: "0x5ce5d65664ce363b6f3da23fb6298001f3068300b43e5a4bb62cb984bc85634e",
      withdraw: "0x4b4ec2750e5e6bc615181e8a8643c462d8bd16c1762b55f76213ddb2ff2cf7a0",
      transfer: "0xab85ab79dc746e7ac2fe90dd79170bf37ca0d908bf50ba33f661077b251926cc",
      secondWithdraw: "0xa2c4b180c2a2231276b982314e93425e97eb0f16d9b36ab718e3e28a538281fa",
    },
  },
  commands: ["npm run check", "genvm-lint contract/contracts/beacon.py", "npm --prefix frontend audit --omit=dev", "npm run evidence:live", "npm run evidence:frontend", "npm run evidence:public"],
}, null, 2));
