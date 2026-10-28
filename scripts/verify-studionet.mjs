import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(new URL("../frontend/package.json", import.meta.url));
const { createClient } = require("genlayer-js");
const { studionet } = require("genlayer-js/chains");

const address = "0x37c8de10d3cC7ba4353608441A57a917e9628618";
const deployment = "0x26abab424352d9b30938aa7d9dd06a5d0cb0f713c48f9460ba2903527d11e0ab";
const localSource = readFileSync(new URL("../contract/contracts/beacon.py", import.meta.url), "utf8");
const client = createClient({ chain: studionet });

const transaction = await client.getTransaction({ hash: deployment });
const raw = await client.request({ method: "eth_getTransactionByHash", params: [deployment] });
if (transaction.statusName !== "FINALIZED" || raw.result_name !== "MAJORITY_AGREE") throw new Error("hardened deployment is not finalized by majority agreement");
if (raw.consensus_data?.leader_receipt?.[0]?.execution_result !== "SUCCESS") throw new Error("hardened deployment rolled back");
if (String(raw.recipient || raw.to_address || "").toLowerCase() !== address.toLowerCase()) throw new Error("deployment recipient differs from recorded contract address");

const deployedSource = await client.getContractCode(address);
const localSha256 = createHash("sha256").update(localSource).digest("hex");
const deployedSha256 = createHash("sha256").update(deployedSource).digest("hex");
if (deployedSource !== localSource || deployedSha256 !== localSha256) throw new Error("deployed contract source differs from reviewed local source");

console.log(JSON.stringify({ address, deployment, sourceBytes: Buffer.byteLength(deployedSource), sourceSha256: deployedSha256, finalized: transaction.statusName, consensusResult: raw.result_name, leaderExecution: raw.consensus_data?.leader_receipt?.[0]?.execution_result }, null, 2));
