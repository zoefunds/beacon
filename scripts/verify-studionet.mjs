import { createRequire } from "node:module";

const require = createRequire(new URL("../frontend/package.json", import.meta.url));
const { createClient } = require("genlayer-js");
const { studionet } = require("genlayer-js/chains");

const address = "0xeE34e10CF770aaDbfA9C369Eec946eb5c3D164E9";
const wallet = "0x1c2e587043568239b2fcaec5f96f278eb134b7f5";
const hashes = {
  deploy: "0x4038cc6af9f83d30a7ac3daab2202a9da564bcb147046fb4405c5135ec41b4c8",
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
};

const client = createClient({ chain: studionet });
const raw = {};
for (const [name, hash] of Object.entries(hashes)) {
  if (!/^0x[0-9a-f]{64}$/i.test(hash)) throw new Error(`${name} hash is not recorded`);
  const transaction = await client.getTransaction({ hash });
  if (transaction.statusName !== "FINALIZED") throw new Error(`${name} is not finalized`);
  raw[name] = await client.request({ method: "eth_getTransactionByHash", params: [hash] });
}

const leaderSucceeded = tx => tx.consensus_data?.leader_receipt?.[0]?.execution_result === "SUCCESS";
const leaderFailed = tx => tx.consensus_data?.leader_receipt?.[0]?.execution_result === "ERROR";
const consensusWrites = ["deploy", "openRelease", "depositFunding", "sponsor", "sealRelease", "beginInventory", "discoverInventory", "closeInventory", "materialize", "buildGraph", "assessComponent", "proposeCertificate", "finalize", "withdraw", "secondWithdraw"];
for (const name of consensusWrites) {
  if (raw[name].result_name !== "MAJORITY_AGREE" || !leaderSucceeded(raw[name])) throw new Error(`${name} did not execute under majority agreement`);
}
for (const name of ["blockedPrematureFinalize", "blockedDuplicateFinalize"]) {
  if (raw[name].result_name !== "MAJORITY_AGREE" || !leaderFailed(raw[name])) throw new Error(`${name} did not roll back as expected`);
}

if (BigInt(raw.depositFunding.value) !== 10n ** 18n || raw.depositFunding.value_credited !== true) throw new Error("deposit was not exactly 1 credited GEN");
if (BigInt(raw.openRelease.value || 0) !== 0n || BigInt(raw.sponsor.value || 0) !== 0n) throw new Error("agreement/allocation unexpectedly carried value");
if (BigInt(raw.transfer.value) !== 10n ** 18n || raw.transfer.value_credited !== true) throw new Error("beneficiary transfer was not exactly 1 credited GEN");
if (!raw.withdraw.triggered_transactions?.includes(hashes.transfer)) throw new Error("withdrawal is not linked to the beneficiary transfer");
if ((raw.secondWithdraw.triggered_transactions || []).length !== 0) throw new Error("second withdrawal emitted a transfer");

const release = JSON.parse(await client.readContract({ address, functionName: "get_release", args: [1n] }));
const entry = JSON.parse(await client.readContract({ address, functionName: "get_entry", args: [1n, 0n] }));
const component = JSON.parse(await client.readContract({ address, functionName: "get_component", args: [1n, 0n] }));
const balance = BigInt(await client.readContract({ address, functionName: "get_balance", args: [wallet] }));
const fundingBalance = BigInt(await client.readContract({ address, functionName: "get_funding_balance", args: [wallet] }));

if (release.state !== "ACCEPTED" || release.certificate?.outcome !== "ACCEPTED") throw new Error("release is not accepted and finalized");
if (release.seal?.commit !== "d0dd1f61b33d64e29d8bc1372a94ef6a2fee76a9" || release.seal?.tree !== "d7cee29eaada459ba458a63ad983a89915c6a10a") throw new Error("stored seal differs");
if (JSON.stringify(release.certificate.coverage) !== JSON.stringify([1, 1, 1, 1, 0, 0]) || release.blockers.length !== 0) throw new Error("coverage or blockers differ");
for (const root of ["agreement_root", "seal_root", "inventory_root", "assessment_root", "edge_root", "obligation_root"]) if (!/^[0-9a-f]{64}$/.test(release.certificate[root] || "")) throw new Error(`${root} is invalid`);
if (entry.path !== "index.html" || entry.status !== "VERIFIED" || entry.blob !== "a83618bcf17b4e8e643de75d09adc0e892043020") throw new Error("entry is not byte-verified");
if (component.assessment?.result !== "ACCEPT" || JSON.stringify(component.assessment.statuses) !== JSON.stringify(["MET"])) throw new Error("semantic result/status coverage differs");
if (balance !== 0n || fundingBalance !== 0n) throw new Error("post-withdraw contract balances are not zero");

const semanticConsensus = {};
for (const name of ["assessComponent", "proposeCertificate"]) {
  const votes = raw[name].consensus_data?.votes || {};
  const agree = Object.values(votes).filter(vote => vote === "agree").length;
  if (agree < 3) throw new Error(`${name} lacks validator quorum`);
  semanticConsensus[name] = { hash: hashes[name], agree, votes };
}

console.log(JSON.stringify({ address, hashes, release, entry, component: component.assessment, semanticConsensus, balances: { settlement: String(balance), funding: String(fundingBalance) } }, null, 2));
