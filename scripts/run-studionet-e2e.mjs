import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(new URL("../frontend/package.json", import.meta.url));
const { createClient } = require("genlayer-js");
const { studionet } = require("genlayer-js/chains");
const { privateKeyToAccount } = require("viem/accounts");

const address = process.env.BEACON_CONTRACT_ADDRESS;
const keystorePath = process.env.BEACON_KEYSTORE_PATH;
const password = process.env.BEACON_KEYSTORE_PASSWORD;
if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) throw new Error("BEACON_CONTRACT_ADDRESS is required");
if (!keystorePath || !password) throw new Error("BEACON_KEYSTORE_PATH and BEACON_KEYSTORE_PASSWORD are required");

const privateKey = execFileSync("python3", ["-c", "import json,os,sys; from eth_account import Account; print('0x'+Account.decrypt(json.load(sys.stdin),os.environ['BEACON_KEYSTORE_PASSWORD']).hex())"], {
  input: readFileSync(keystorePath), encoding: "utf8", env: { ...process.env, BEACON_KEYSTORE_PASSWORD: password },
}).trim();
const account = privateKeyToAccount(privateKey);
const client = createClient({ chain: studionet, account });
const transactions = {};

function assertFinalized(receipt, label) {
  if (receipt?.result_name !== "MAJORITY_AGREE") throw new Error(`${label}: consensus result ${String(receipt?.result_name)}`);
  const leader = receipt?.consensus_data?.leader_receipt?.[0];
  if (leader?.execution_result !== "SUCCESS" || leader?.result?.status !== "return") {
    throw new Error(`${label}: ${leader?.result?.payload?.readable || leader?.execution_result || "execution failed"}`);
  }
}

async function write(label, functionName, args = [], value = 0n) {
  const hash = await client.writeContract({ address, functionName, args, value });
  console.error(`${label} broadcast: ${hash}`);
  let receipt;
  for (let attempt = 1; attempt <= 120; attempt += 1) {
    try {
      receipt = await client.getTransaction({ hash });
      if (receipt?.statusName === "FINALIZED") break;
    } catch (error) {
      console.error(`${label} poll ${attempt}: ${error instanceof Error ? error.message : String(error)}`);
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  if (receipt?.statusName !== "FINALIZED") throw new Error(`${label}: finality timeout for ${hash}`);
  assertFinalized(receipt, label);
  transactions[label] = hash;
  console.error(`${label}: ${hash}`);
  return receipt;
}

async function release(id) {
  try {
    const raw = await client.readContract({ address, functionName: "get_release", args: [id] });
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    if (String(error).includes("unknown_release")) return null;
    throw error;
  }
}

const resumeId = process.env.BEACON_RELEASE_ID;
const releaseId = resumeId
  ? BigInt(resumeId)
  : BigInt(String(await client.readContract({ address, functionName: "get_next_id", args: [] })));
let sealBy = Math.floor(Date.now() / 1000) + Number(process.env.BEACON_SEAL_DELAY_SECONDS || 420);
const repo = "sindresorhus/yoctocolors";
const ref = "main";
const baseline = "a02a16ec36fbd58a0848e95598fb4913c54c7591";
const commit = "a85b98a90e5731914567d8c209e7ec45ac2d24e2";
const obligations = ["The scoped security policy provides a private GitHub security advisory link for reporting vulnerabilities."];
const scope = [".github/security.md"];
const requiredChecks = [
  { name: "Node.js 18", app_slug: "github-actions" },
  { name: "Node.js 23", app_slug: "github-actions" },
];

let current = await release(releaseId);
if (!current) {
  await write("openRelease", "open_release", [repo, ref, baseline, account.address, "Security policy release", JSON.stringify(obligations), JSON.stringify(scope), JSON.stringify(requiredChecks), BigInt(sealBy)]);
  current = await release(releaseId);
}
sealBy = Number(current.seal_by);
if (current.state === "DRAFT") {
  const escrow = BigInt(String(current.escrow));
  if (escrow < 10n ** 18n) {
    const funding = BigInt(String(await client.readContract({ address, functionName: "get_funding_balance", args: [account.address] })));
    const needed = 10n ** 18n - escrow;
    if (funding < needed) await write("depositFunding", "deposit_funding", [], needed - funding);
    await write("sponsor", "sponsor", [releaseId, needed]);
  }
  await write("sealRelease", "seal_release", [releaseId, commit]);
  current = await release(releaseId);
}
if (current.state !== "SEALED") throw new Error(`cannot continue release ${releaseId} from ${current.state}`);

while (Math.floor(Date.now() / 1000) <= sealBy) {
  const remaining = sealBy - Math.floor(Date.now() / 1000) + 1;
  console.error(`waiting for seal deadline: ${remaining}s`);
  await new Promise(resolve => setTimeout(resolve, Math.min(15, remaining) * 1000));
}

await write("beginInventory", "begin_inventory", [releaseId]);
await write("discoverInventory", "discover_inventory", [releaseId]);
await write("closeInventory", "close_inventory", [releaseId]);
await write("materialize", "materialize", [releaseId, 0]);
await write("buildReviewGraph", "build_review_graph", [releaseId]);
await write("assessComponent", "assess_component", [releaseId, 0]);
const beforeProposal = await release(releaseId);
for (let index = 0; index < Number(beforeProposal.edge_count || 0); index += 1) await write(`reviewEdge${index}`, "review_edge", [releaseId, index]);
await write("propose", "propose", [releaseId]);
const proposed = await release(releaseId);
if (proposed?.certificate?.outcome !== "ACCEPTED") throw new Error(`proposal was ${String(proposed?.certificate?.outcome)}`);
if (process.env.BEACON_RUN_CHALLENGE === "1") {
  await write("challengeCertificate", "challenge_certificate", [releaseId, 0, "Reconfirm that the scoped security policy provides a private GitHub security advisory link for reporting vulnerabilities."]);
  await write("reviewChallenge", "review_challenge", [releaseId]);
  const challenged = await release(releaseId);
  if (challenged?.certificate?.outcome !== "ACCEPTED") throw new Error(`challenge review was ${String(challenged?.certificate?.outcome)}`);
} else {
  while (true) {
    const review = await release(releaseId);
    const remaining = Number(review.challenge_until) - Math.floor(Date.now() / 1000) + 1;
    if (remaining <= 0) break;
    console.error(`waiting for challenge deadline: ${remaining}s`);
    await new Promise(resolve => setTimeout(resolve, Math.min(30, remaining) * 1000));
  }
}
await write("finalize", "finalize", [releaseId]);
const credited = BigInt(String(await client.readContract({ address, functionName: "get_balance", args: [account.address] })));
if (credited !== 10n ** 18n) throw new Error(`unexpected settlement credit ${credited}`);
await write("withdraw", "withdraw", []);
const finalRelease = await release(releaseId);
const finalBalance = BigInt(String(await client.readContract({ address, functionName: "get_balance", args: [account.address] })));
if (finalRelease?.state !== "ACCEPTED" || finalBalance !== 0n) throw new Error("final state or withdrawal balance is incorrect");

console.log(JSON.stringify({
  contract: address,
  account: account.address,
  releaseId: releaseId.toString(),
  repository: repo,
  baseline,
  commit,
  scope,
  requiredChecks,
  seal: finalRelease.seal,
  certificate: finalRelease.certificate,
  finalState: finalRelease.state,
  finalBalance: finalBalance.toString(),
  transactions,
}, null, 2));
