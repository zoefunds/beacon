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
  ["@gl.evm.contract_interface", "EOA withdrawal transfer interface"],
  ["_Recipient(Address(account)).emit_transfer", "EOA withdrawal dispatch"],
  ["if not valid_seal(seal)", "complete seal validation"],
  ["baseline_compare = read_json", "baseline ancestry verification"],
  ["inventory_already_discovered", "idempotent inventory discovery"],
  ["component_count\"] = min(len(ordered_groups), MAX_COMPONENTS)", "bounded graph components"],
  ["current = int(self.balances[account]) if account in self.balances else 0", "safe first balance credit"],
  ["self.balances[account] = u256(0)", "checks-effects before transfer"],
  ["implementer_address = str(implementer)", "runtime address normalization"],
  ["if kind == \"tree\": continue", "directory metadata exclusion"],
  ["len(statuses) != expected", "complete semantic obligation coverage"],
  ["result == \"ACCEPT\" and statuses and any(status != \"MET\" for status in statuses)", "model-level contradictory ACCEPT rejection"],
  ["result == \"ACCEPT\" and any(status != \"MET\" for status in statuses)", "obligation verdict contradictory ACCEPT rejection"],
  ["and all_obligations_met and runtime_evidence_passed and all(x == \"ACCEPT\" for x in edge_results)", "certificate-level all-MET aggregation gate"],
  ["item[\"certificate\"][\"outcome\"] == \"ACCEPTED\" and result == \"ACCEPT\"", "confirmed challenge preserves acceptance"],
  ["item[\"certificate\"][\"outcome\"] == \"ACCEPTED\" and result == \"ACCEPT\" and all_obligations_met", "challenge all-MET preservation gate"],
  ["component_sources", "complete component challenge context"],
  ["dependency_edges", "dependency-aware challenge context"],
  ["\"change_root\": digest", "baseline change evidence commitment"],
  ["\"runtime_root\": digest", "runtime check evidence commitment"],
  ["/check-runs", "public runtime check discovery"],
  ["runtime_evidence_passed", "successful runtime evidence acceptance gate"],
  ["def deposit_funding", "non-reverting value deposit boundary"],
  ["def withdraw_funding", "unallocated funding recovery"],
  ["available - value", "funding allocation debit"],
  ["if item[\"escrow\"] < MIN_ESCROW", "minimum escrow before sealing"],
  ["leader_value[\"statuses\"] == validator_value[\"statuses\"]", "validator agreement on obligation statuses"],
  ["status not in {\"MET\", \"NOT_MET\", \"UNCERTAIN\"}", "bounded semantic status vocabulary"],
  ["item[\"indeterminate_until\"] = now() + INDETERMINATE_REFUND_SECONDS", "challenge uncertainty refund clock"],
  ["filter=latest&per_page=100", "bounded complete check-run request"],
  ["check_total != len(check_runs)", "check-run pagination completeness gate"],
  ["required_checks.issubset(available_checks)", "sponsor-defined required check gate"],
  ["\"runtime_policy_root\": digest(item[\"required_checks\"])", "required check policy commitment"],
  ["str((check or {}).get(\"head_sha\", \"\")).lower() != commit.lower()", "per-check sealed commit binding"],
];
const missing = required.filter(([needle]) => !source.includes(needle)).map(([, name]) => name);
if ((source.match(/_Recipient\(Address\(account\)\)\.emit_transfer/g) || []).length !== 2) {
  missing.push("both settlement and unallocated-funding EOA transfer paths");
}
if (missing.length) {
  console.error(`Protocol guard failed; missing: ${missing.join(", ")}`);
  process.exit(1);
}
console.log(`Protocol guard passed: ${required.length} non-negotiable controls present.`);
