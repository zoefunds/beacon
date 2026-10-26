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

const semanticAddress = "0x9D9AeA8B2B3586AC4B5e36a1B7f646689C3dfa44";
const semanticTransactions = {
  assessComponent: "0xbdda39c7df2b341e5d7adb6ef8ad5a5a2f3efcb2b2a28ea79f631d6b71635396",
  proposeCertificate: "0xe20e354c3ae1de6fc1c6c7c9b70dedd16b2133dca2398c3b37505ac3e3edbc8e",
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

const consensus = {};
for (const [name, hash] of Object.entries(semanticTransactions)) {
  const transaction = await client.request({ method: "eth_getTransactionByHash", params: [hash] });
  const votes = transaction.consensus_data?.votes || {};
  const agree = Object.values(votes).filter(vote => vote === "agree").length;
  if (transaction.status !== "FINALIZED" || agree < 3) throw new Error(`${name} lacks finalized validator consensus`);
  consensus[name] = { contract: semanticAddress, hash, agree, votes };
}

console.log(JSON.stringify({
  activeContract: activeAddress,
  transactions: checked,
  openingEscrowWei: String(opening.value),
  release: { id: release.id, state: release.state, escrow: release.escrow, sealBy: release.seal_by },
  withdrawal: { contractCreditWei: String(credit), walletWei: String(walletBalance), transferValueCredited: transfer.value_credited, duplicateTransferCount: (duplicate.triggered_transactions || []).length },
  nondeterministicConsensus: consensus,
}, null, 2));
