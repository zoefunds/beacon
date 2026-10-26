const origin = "https://bea-con.vercel.app";
const routes = ["/", "/launch", "/attestations?release=1", "/vault"];
const pages = {};
const scripts = new Set();

for (const route of routes) {
  const response = await fetch(origin + route, { redirect: "follow" });
  if (!response.ok) throw new Error(`${route} returned HTTP ${response.status}`);
  const html = await response.text();
  pages[route] = { status: response.status, bytes: Buffer.byteLength(html) };
  for (const match of html.matchAll(/<script[^>]+src="([^"]+)"/g)) scripts.add(new URL(match[1], origin).href);
}

let productionSource = "";
for (const url of scripts) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  productionSource += `\n${await response.text()}`;
}

const required = [
  "0x48629d95C2b1e51790d12b3E55108e5902727D4c",
  "FINALIZED",
  "seal_release",
  "sponsor",
  "begin_inventory",
  "discover_inventory",
  "close_inventory",
  "materialize",
  "build_review_graph",
  "assess_component",
  "review_edge",
  "propose",
  "challenge_certificate",
  "review_challenge",
  "finalize",
  "expire_unsealed",
  "refund_indeterminate",
  "withdraw",
  "Inspect every committed evidence record.",
  "Withdraw settled GEN safely.",
  "Indeterminate → sponsors after 7 days",
];

const missing = required.filter(value => !productionSource.includes(value));
if (missing.length) throw new Error(`production bundles are missing: ${missing.join(", ")}`);

console.log(JSON.stringify({
  origin,
  pages,
  scriptCount: scripts.size,
  contract: required[0],
  finalizedReceiptHandling: true,
  lifecycleOperations: required.slice(2, 18),
  dedicatedAttestationAndVaultRoutes: true,
  correctedIndeterminateRefundCopy: true,
}, null, 2));
