import { execFileSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const files = [
  "contract/contracts/beacon.py",
  "contract/tests/direct/test_lifecycle.py",
  "contract/tests/test_source_guards.py",
  "contract/tests/mutation/run.py",
  "frontend/app/page.tsx",
  "frontend/components/ReleaseMonitor.tsx",
  "frontend/lib/beacon-client.ts",
  "scripts/verify-studionet.mjs",
];

const results = {};
for (const path of files) {
  const url = `https://raw.githubusercontent.com/zoefunds/beacon/${commit}/${path}`;
  const response = await fetch(url, { redirect: "error" });
  if (!response.ok) throw new Error(`${path} is not public at ${commit}: HTTP ${response.status}`);
  const body = await response.text();
  if (!body.trim()) throw new Error(`${path} is empty at ${commit}`);
  results[path] = { url, bytes: Buffer.byteLength(body) };
}

console.log(JSON.stringify({ repository: "https://github.com/zoefunds/beacon", visibility: "PUBLIC", commit, files: results }, null, 2));
