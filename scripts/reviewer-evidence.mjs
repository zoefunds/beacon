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
  reviewTag: "reviewer-evidence-2026-10-27-v13",
  contract: {
    network: "GenLayer Studionet",
    chainId: 61999,
    address: "0x37c8de10d3cC7ba4353608441A57a917e9628618",
    deploymentTransaction: "0x26abab424352d9b30938aa7d9dd06a5d0cb0f713c48f9460ba2903527d11e0ab",
    sourceBytes: source.length,
    sourceSha256: createHash("sha256").update(source).digest("hex"),
  },
  frontend: {
    productionUrl: "https://bea-con.vercel.app/",
    immutableUrl: "https://bea-3ymhr18yh-adebiyi2002gmailcoms-projects.vercel.app",
    deploymentId: "dpl_AV3Ayae1L21oUudRXEYmBqqN5fQf",
    attestation: "https://bea-con.vercel.app/attestations",
    vault: "https://bea-con.vercel.app/vault",
  },
  activeStudionetEvidence: {
    repository: "sindresorhus/yoctocolors",
    baseline: "a02a16ec36fbd58a0848e95598fb4913c54c7591",
    commit: "a85b98a90e5731914567d8c209e7ec45ac2d24e2",
    tree: "a84bb8a4bccb5b71aa3d809d6f6fe504a2ff485e",
    scope: [".github/security.md"],
    requiredChecks: ["Node.js 18@github-actions", "Node.js 23@github-actions"],
    indeterminateChallengeReleases: [1, 2],
    acceptedRelease: 3,
    acceptedCoverage: [1, 1, 1, 1, 0, 0],
    acceptedRoots: {
      agreement: "fd5ad1caab16e8c791137d0692b6ca9823bb37b2d9d7428a13c40e0f19aac58c",
      seal: "ebe7aa489cf3673d69fb068bd55c7d29ad6d381f01789c1557176e7561c62d77",
      inventory: "eace422f14eb4a46a850e74fc8eea987727ce5f1cd9b4f26a90aec1e9ea6e7f0",
      assessment: "fdaeed23edbe686d1e0b3b35222bae4a2b00c27f6620966815ddce78d3263043",
      edges: "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
      obligations: "bc25e2c10b641c0175fd793872359372d73123250780a5a6af799e9b6410933e",
    },
    transactions: {
      openRelease: "0x3ffbc588bdbdc952d71906a6f93e94187d1007681c5a78a6a749cb21f660c541",
      depositFunding: "0x34887dc7236f48cc8e4f85a10945bc88281f256f7d24a8dfce68966a15954206",
      sponsor: "0xd2fd3038b3ad259ded92651427ebf4cc437bbc7df11dbfa919eff26b34c30b1d",
      sealRelease: "0x0bf69dd93ea2aa6b20b4724e4b6bf4dc3d6dece520b7a40290ae5d1912378115",
      beginInventory: "0xe8034f82296af0463d06016972af4cec969aa2b4f66543d12ce2f539b2df05c6",
      discoverInventory: "0x6419260e04535c9cbe0c8f6f794937a4eabca0e6f8915aca9a2cf60d00f157f8",
      closeInventory: "0x2c93c234d627649a34df2ce4397bb1abc5397b3b139843e73841da0e8d478a3c",
      materialize: "0x4f48a2affa80afe620b1e8ada4eefca20b08e7bb2c339a4d479c4284cf96bd5b",
      buildReviewGraph: "0xf568e04c9bc10725a254e2eed094709f81c5205878e39b8f6a20ad6bca60b867",
      assessComponent: "0xddbeff037e0828a96348a5cda0691f537b4558217263e775f1e09eaf0d8f50cc",
      propose: "0xccb4d11ad0ea839f30f30b3e09e64cceabda6ad45f7fc7a7d759d94f0094a0a5",
      finalize: "0x2b0b9859411655733de00bbe390aba37af5e801dbc549c2df7c5218b95654e2a",
      withdraw: "0xbe9c8ea8c7a535379f45bee894a1d92d1af5b097ba61adc53c26d50d216ec243",
      transfer: "0x1b34cd0d88b50f8099a9b9660d1ef4d49322bc97cfb1650a43a2edb5a9ec789d",
    },
  },
  commands: ["npm run check", "genvm-lint contract/contracts/beacon.py", "npm --prefix frontend audit --omit=dev", "npm run evidence:live", "npm run evidence:frontend", "npm run evidence:public"],
}, null, 2));
