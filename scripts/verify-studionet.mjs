import { createRequire } from "node:module";

const require = createRequire(new URL("../frontend/package.json", import.meta.url));
const { createClient } = require("genlayer-js");
const { studionet } = require("genlayer-js/chains");

const address = "0x9D9AeA8B2B3586AC4B5e36a1B7f646689C3dfa44";
const transactions = {
  seal: "0x8133a445efb0405283c488e08ed1cb71eea6722d43bcde29ecb5cb1dfc0a36cd",
  beginInventory: "0x84411ce81ec40436f70f269e8d24d1a4791c021a93a69e6afe2e5ba28319a944",
  discoverInventory: "0x1c5c78beebbadd67d823e5a5aa78ea725bcdaecb73928752298b2028c10a1464",
  closeInventory: "0xdcb1f428650ea363fd6909a8db42a2da6248a73bc8340721f3417dd96b52165b",
  materialize: "0x7857348eaea4e3a3de0bfc95d06dd5381c24af79e05f84a0363bd0546d96a22b",
  buildReviewGraph: "0x348a2389439c44001b82d8253b0724e3417e128395592efaf919f7f811c0d738",
  assessComponent: "0xbdda39c7df2b341e5d7adb6ef8ad5a5a2f3efcb2b2a28ea79f631d6b71635396",
  proposeCertificate: "0xe20e354c3ae1de6fc1c6c7c9b70dedd16b2133dca2398c3b37505ac3e3edbc8e",
};

const client = createClient({ chain: studionet });
const checked = {};
for (const [name, hash] of Object.entries(transactions)) {
  const transaction = await client.getTransaction({ hash });
  checked[name] = { hash, status: transaction.statusName, result: transaction.result_name };
  if (transaction.statusName !== "FINALIZED" || transaction.result_name !== "MAJORITY_AGREE") {
    throw new Error(`${name} is not a finalized majority-agree transaction`);
  }
}

const release = JSON.parse(await client.readContract({ address, functionName: "get_release", args: [1n] }));
const expectedCoverage = [1, 1, 1, 1, 0, 0];
if (JSON.stringify(release.certificate?.coverage) !== JSON.stringify(expectedCoverage)) throw new Error("unexpected release coverage");
if (release.certificate?.outcome !== "INDETERMINATE") throw new Error("unexpected release outcome");
if (release.blockers?.length !== 0) throw new Error("live release has blockers");

console.log(JSON.stringify({ contract: address, transactions: checked, release: {
  id: release.id,
  state: release.state,
  outcome: release.certificate.outcome,
  coverage: release.certificate.coverage,
  blockers: release.blockers,
  indeterminateUntil: release.indeterminate_until,
} }, null, 2));
