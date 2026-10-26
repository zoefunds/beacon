import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(process.env.BEACON_CONTRACT_PATH || resolve("contract/contracts/beacon.py"), "utf8");
const required = [
  ["def seal_release", "release seal operation"],
  ["if now() >= item[\"seal_by\"]", "pre-deadline seal enforcement"],
  ["def discover_inventory", "contract-owned tree inventory"],
  ["?recursive=1", "complete tree request"],
  ["tree.get(\"truncated\")", "truncated-tree fail closed guard"],
  ["blob_sha(raw) != entry[\"blob\"]", "Git blob-byte verification"],
  ["def resolve_local_import", "deterministic dependency resolver"],
  ["gl.vm.run_nondet(leader, validator)", "consensus semantic judgment"],
  ["gl.nondet.exec_prompt", "GenLayer prompt primitive"],
  ["gl.eq_principle.strict_eq(fetch_seal)", "strict-equivalence release sealing"],
  ["gl.eq_principle.strict_eq(fetch_tree)", "strict-equivalence tree inventory"],
  ["gl.eq_principle.strict_eq(fetch_blob)", "strict-equivalence blob verification"],
  ["unresolved_local_import", "unresolved dependency blocker"],
  ["coverage_incomplete", "coverage gate"],
  ["all(x == \"ACCEPT\" for x in edge_results)", "dependency-edge acceptance gate"],
  ["\"edge_root\": digest(reviewed_edges)", "edge commitment in certificate"],
  ["def challenge_certificate", "certificate challenge path"],
  ["def review_challenge", "challenge reassessment"],
  ["def refund_indeterminate", "bounded indeterminate refund path"],
  ["if not valid_seal(seal)", "complete seal validation"],
  ["baseline_compare = read_json", "baseline ancestry verification"],
  ["inventory_already_discovered", "idempotent inventory discovery"],
  ["component_count\"] = min(len(ordered_groups), MAX_COMPONENTS)", "bounded graph components"],
  ["current = int(self.balances[account]) if account in self.balances else 0", "safe first balance credit"],
  ["self.balances[account] = u256(0)", "checks-effects before transfer"],
];
const missing = required.filter(([needle]) => !source.includes(needle)).map(([, name]) => name);
if (missing.length) {
  console.error(`Protocol guard failed; missing: ${missing.join(", ")}`);
  process.exit(1);
}
console.log(`Protocol guard passed: ${required.length} non-negotiable controls present.`);
