import { createRequire } from "node:module";

const require = createRequire(new URL("../frontend/package.json", import.meta.url));
const { createClient } = require("genlayer-js");
const { studionet } = require("genlayer-js/chains");

const activeAddress = "0x48629d95C2b1e51790d12b3E55108e5902727D4c";
const wallet = "0x1c2e587043568239b2fcaec5f96f278eb134b7f5";
const activeTransactions = {
  deploy: "0xce6f6c496d144c1fdd6f8134ab45d4cff7081913b0c78e04881058565ecfa8d0",
  openRelease: "0x35316f278f9afe08dc1ac761c36af4cc0440c517329d4a9f49fa62642f13e5a7",
  expireUnsealed: "0xb6fc86601e4fa1ea931e0acb270994d9c4ece7d7324a60ffc90c84b1d5e92330",
  withdraw: "0x53de362f8923ff6eb437798f03603b9644d693fc9c1c9bee3122cdc019153024",
  transfer: "0xca18a8edef2b44b93368b0ad6f6b7fefc3b6b86d78669b7a5ff2438e0fddf31d",
  secondWithdraw: "0x5080326c39e89f87bb9b7c20d3b65786a78abb5022d3a2ce479dcb61133c7674",
};

const certificateTransactions = {
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
};

const client = createClient({ chain: studionet });
const checked = {};
for (const [name, hash] of Object.entries(activeTransactions)) {
  const transaction = await client.getTransaction({ hash });
  checked[name] = { hash, status: transaction.statusName, result: transaction.result_name };
  if (transaction.statusName !== "FINALIZED") throw new Error(`${name} is not finalized`);
  if (name !== "transfer" && transaction.result_name !== "MAJORITY_AGREE") throw new Error(`${name} lacks majority agreement`);
}

const opening = await client.request({ method: "eth_getTransactionByHash", params: [activeTransactions.openRelease] });
if (BigInt(opening.value) !== 10n ** 18n) throw new Error("opening did not escrow exactly 1 GEN");
const transfer = await client.request({ method: "eth_getTransactionByHash", params: [activeTransactions.transfer] });
if (BigInt(transfer.value) !== 10n ** 18n || transfer.value_credited !== true) throw new Error("EOA transfer was not credited");
const withdrawal = await client.request({ method: "eth_getTransactionByHash", params: [activeTransactions.withdraw] });
if (!withdrawal.triggered_transactions?.includes(activeTransactions.transfer)) throw new Error("withdrawal does not link the EOA transfer");
const duplicate = await client.request({ method: "eth_getTransactionByHash", params: [activeTransactions.secondWithdraw] });
if ((duplicate.triggered_transactions || []).length !== 0) throw new Error("second withdrawal emitted a transfer");

const release = JSON.parse(await client.readContract({ address: activeAddress, functionName: "get_release", args: [1n] }));
if (release.state !== "EXPIRED" || BigInt(release.escrow) !== 10n ** 18n) throw new Error("unexpected release settlement state");
const credit = BigInt(await client.readContract({ address: activeAddress, functionName: "get_balance", args: [wallet] }));
const walletBalance = BigInt(await client.request({ method: "eth_getBalance", params: [wallet, "latest"] }));
if (credit !== 0n || walletBalance !== 10n ** 18n) throw new Error("post-withdrawal balances are incorrect");

const certificateChecked = {};
for (const [name, hash] of Object.entries(certificateTransactions)) {
  const transaction = await client.getTransaction({ hash });
  certificateChecked[name] = { hash, status: transaction.statusName, result: transaction.result_name };
  if (transaction.statusName !== "FINALIZED") throw new Error(`certificate ${name} is not finalized`);
  if (name !== "transfer" && transaction.result_name !== "MAJORITY_AGREE") throw new Error(`certificate ${name} lacks majority agreement`);
}
const rawCertificate = {};
for (const [name, hash] of Object.entries(certificateTransactions)) {
  rawCertificate[name] = await client.request({ method: "eth_getTransactionByHash", params: [hash] });
}
const executionFailed = transaction => transaction.consensus_data?.leader_receipt?.[0]?.execution_result === "ERROR";
if (!executionFailed(rawCertificate.blockedLateSubstitution)) throw new Error("post-deadline seal substitution did not roll back");
if (!executionFailed(rawCertificate.blockedDuplicateFinalize)) throw new Error("duplicate finalization did not roll back");
if (BigInt(rawCertificate.openRelease.value) !== 10n ** 18n) throw new Error("certificate release did not escrow exactly 1 GEN");
if (BigInt(rawCertificate.transfer.value) !== 10n ** 18n || rawCertificate.transfer.value_credited !== true) throw new Error("certificate-path EOA transfer was not credited");
if (!rawCertificate.withdraw.triggered_transactions?.includes(certificateTransactions.transfer)) throw new Error("certificate withdrawal does not link its EOA transfer");
if ((rawCertificate.secondWithdraw.triggered_transactions || []).length !== 0) throw new Error("certificate second withdrawal emitted a transfer");

const certificateRelease = JSON.parse(await client.readContract({ address: activeAddress, functionName: "get_release", args: [2n] }));
const certificateEntry = JSON.parse(await client.readContract({ address: activeAddress, functionName: "get_entry", args: [2n, 0n] }));
if (certificateRelease.state !== "REJECTED" || certificateRelease.certificate?.outcome !== "REJECTED") throw new Error("certificate release is not rejected and finalized");
if (certificateRelease.seal?.commit !== "d0dd1f61b33d64e29d8bc1372a94ef6a2fee76a9" || certificateRelease.seal?.tree !== "d7cee29eaada459ba458a63ad983a89915c6a10a") throw new Error("stored seal changed after the deadline");
if (certificateRelease.inventory_count !== 1 || certificateRelease.materialized_count !== 1 || certificateRelease.blockers.length !== 0) throw new Error("deterministic evidence coverage is incomplete");
if (JSON.stringify(certificateRelease.certificate.coverage) !== JSON.stringify([1, 1, 1, 1, 0, 0])) throw new Error("certificate coverage differs");
for (const root of ["agreement_root", "seal_root", "inventory_root", "edge_root", "assessment_root", "obligation_root"]) {
  if (!/^[0-9a-f]{64}$/.test(certificateRelease.certificate[root] || "")) throw new Error(`${root} is missing`);
}
if (certificateEntry.path !== "index.html" || certificateEntry.status !== "VERIFIED" || certificateEntry.blob !== "a83618bcf17b4e8e643de75d09adc0e892043020") throw new Error("inventory entry is not byte-verified");

const activeConsensus = {};
for (const name of ["assessComponent", "proposeCertificate"]) {
  const transaction = rawCertificate[name];
  const votes = transaction.consensus_data?.votes || {};
  const agree = Object.values(votes).filter(vote => vote === "agree").length;
  if (transaction.status !== "FINALIZED" || agree < 3) throw new Error(`${name} lacks active validator consensus`);
  activeConsensus[name] = { hash: certificateTransactions[name], agree, votes };
}

console.log(JSON.stringify({
  activeContract: activeAddress,
  transactions: checked,
  openingEscrowWei: String(opening.value),
  release: { id: release.id, state: release.state, escrow: release.escrow, sealBy: release.seal_by },
  withdrawal: { contractCreditWei: String(credit), walletWei: String(walletBalance), transferValueCredited: transfer.value_credited, duplicateTransferCount: (duplicate.triggered_transactions || []).length },
  certificateLifecycle: {
    transactions: certificateChecked,
    release: { id: certificateRelease.id, state: certificateRelease.state, seal: certificateRelease.seal, certificate: certificateRelease.certificate },
    inventoryEntry: certificateEntry,
    activeConsensus,
  },
}, null, 2));
