"""Prove the protocol guard rejects security-critical source mutations."""
import os
import subprocess
import tempfile
from pathlib import Path


ROOT = Path(__file__).parents[3]
SOURCE = ROOT / "contract" / "contracts" / "beacon.py"


def mutation_is_rejected(needle: str, replacement: str, replace_all: bool = False) -> bool:
    source = SOURCE.read_text(encoding="utf-8")
    assert needle in source, f"mutation target absent: {needle}"
    with tempfile.NamedTemporaryFile("w", suffix=".py", encoding="utf-8", delete=False) as handle:
        handle.write(source.replace(needle, replacement, -1 if replace_all else 1))
        path = handle.name
    try:
        environment = os.environ | {"BEACON_CONTRACT_PATH": path}
        result = subprocess.run(["node", "scripts/audit-protocol.mjs"], cwd=ROOT, env=environment, capture_output=True, text=True)
        return result.returncode != 0
    finally:
        Path(path).unlink(missing_ok=True)


def test_removing_the_deadline_guard_is_rejected():
    assert mutation_is_rejected('if now() >= item["seal_by"]', 'if False')


def test_removing_the_tree_truncation_guard_is_rejected():
    assert mutation_is_rejected('tree.get("truncated")', 'False')


def test_removing_blob_hash_validation_is_rejected():
    assert mutation_is_rejected('blob_sha(raw) != entry["blob"]', 'False')


def test_removing_dependency_acceptance_gate_is_rejected():
    assert mutation_is_rejected('all(x == "ACCEPT" for x in edge_results)', 'True')


def test_removing_first_credit_membership_guard_is_rejected():
    assert mutation_is_rejected('current = int(self.balances[account]) if account in self.balances else 0', 'current = int(self.balances[account])')


def test_removing_complete_seal_validation_is_rejected():
    assert mutation_is_rejected('if not valid_seal(seal)', 'if False')


def test_removing_baseline_ancestry_check_is_rejected():
    assert mutation_is_rejected('baseline_compare = read_json', 'baseline_lookup = read_json')


def test_removing_indeterminate_refund_is_rejected():
    assert mutation_is_rejected('def refund_indeterminate', 'def disabled_refund_indeterminate')

def test_replacing_eoa_transfer_with_ic_call_is_rejected():
    assert mutation_is_rejected('_Recipient(Address(account)).emit_transfer', 'gl.get_contract_at(Address(account)).emit_transfer', replace_all=True)


def test_removing_runtime_address_normalization_is_rejected():
    assert mutation_is_rejected('implementer_address = str(implementer)', 'implementer_address = implementer')


def test_removing_directory_metadata_exclusion_is_rejected():
    assert mutation_is_rejected('if kind == "tree": continue', 'if False: continue')


def test_removing_complete_obligation_status_coverage_is_rejected():
    assert mutation_is_rejected('len(statuses) != expected', 'False')


def test_allowing_model_accept_with_non_met_status_is_rejected():
    assert mutation_is_rejected('result == "ACCEPT" and statuses and any(status != "MET" for status in statuses)', 'False')


def test_allowing_obligation_accept_with_non_met_status_is_rejected():
    assert mutation_is_rejected('result == "ACCEPT" and any(status != "MET" for status in statuses)', 'False')


def test_removing_certificate_all_met_gate_is_rejected():
    assert mutation_is_rejected('and all_obligations_met and runtime_evidence_passed and all(x == "ACCEPT" for x in edge_results)', 'and runtime_evidence_passed and all(x == "ACCEPT" for x in edge_results)')


def test_removing_challenge_all_met_gate_is_rejected():
    assert mutation_is_rejected('and result == "ACCEPT" and all_obligations_met', 'and result == "ACCEPT"')


def test_removing_challenge_component_context_is_rejected():
    assert mutation_is_rejected('"component_sources":', '"selected_sources":')


def test_removing_baseline_change_commitment_is_rejected():
    assert mutation_is_rejected('"change_root":', '"disabled_change_root":', replace_all=True)


def test_removing_runtime_check_commitment_is_rejected():
    assert mutation_is_rejected('"runtime_root":', '"disabled_runtime_root":', replace_all=True)


def test_removing_runtime_evidence_acceptance_gate_is_rejected():
    assert mutation_is_rejected('and runtime_evidence_passed and all(x == "ACCEPT" for x in edge_results)', 'and all(x == "ACCEPT" for x in edge_results)')


def test_removing_confirmed_challenge_acceptance_is_rejected():
    assert mutation_is_rejected('item["certificate"]["outcome"] == "ACCEPTED" and result == "ACCEPT"', 'False')


def test_removing_safe_value_deposit_boundary_is_rejected():
    assert mutation_is_rejected('def deposit_funding', 'def disabled_deposit_funding')


def test_removing_unallocated_funding_recovery_is_rejected():
    assert mutation_is_rejected('def withdraw_funding', 'def disabled_withdraw_funding')


def test_removing_funding_debit_is_rejected():
    assert mutation_is_rejected('available - value', 'available')


def test_removing_minimum_escrow_seal_gate_is_rejected():
    assert mutation_is_rejected('if item["escrow"] < MIN_ESCROW', 'if False')


def test_removing_validator_status_consensus_is_rejected():
    assert mutation_is_rejected('leader_value["statuses"] == validator_value["statuses"]', 'True')


def test_removing_bounded_status_vocabulary_is_rejected():
    assert mutation_is_rejected('status not in {"MET", "NOT_MET", "UNCERTAIN"}', 'False', replace_all=True)


def test_removing_challenge_uncertainty_clock_is_rejected():
    assert mutation_is_rejected('item["indeterminate_until"] = now() + INDETERMINATE_REFUND_SECONDS', 'item["indeterminate_until"] = now()', replace_all=True)


def test_removing_check_run_response_completeness_is_rejected():
    assert mutation_is_rejected('check_total != len(check_runs)', 'False')


def test_removing_sponsor_required_check_policy_is_rejected():
    assert mutation_is_rejected('required_checks.issubset(available_checks)', 'True')


def test_removing_per_check_commit_binding_is_rejected():
    assert mutation_is_rejected('str((check or {}).get("head_sha", "")).lower() != commit.lower()', 'False')


def test_removing_runtime_policy_commitment_is_rejected():
    assert mutation_is_rejected('"runtime_policy_root": digest(item["required_checks"])', '"runtime_policy_root": "0" * 64')


if __name__ == "__main__":
    tests = [
        test_removing_the_deadline_guard_is_rejected,
        test_removing_the_tree_truncation_guard_is_rejected,
        test_removing_blob_hash_validation_is_rejected,
        test_removing_dependency_acceptance_gate_is_rejected,
        test_removing_first_credit_membership_guard_is_rejected,
        test_removing_complete_seal_validation_is_rejected,
        test_removing_baseline_ancestry_check_is_rejected,
        test_removing_indeterminate_refund_is_rejected,
        test_replacing_eoa_transfer_with_ic_call_is_rejected,
        test_removing_runtime_address_normalization_is_rejected,
        test_removing_directory_metadata_exclusion_is_rejected,
        test_removing_complete_obligation_status_coverage_is_rejected,
        test_allowing_model_accept_with_non_met_status_is_rejected,
        test_allowing_obligation_accept_with_non_met_status_is_rejected,
        test_removing_certificate_all_met_gate_is_rejected,
        test_removing_challenge_all_met_gate_is_rejected,
        test_removing_challenge_component_context_is_rejected,
        test_removing_baseline_change_commitment_is_rejected,
        test_removing_runtime_check_commitment_is_rejected,
        test_removing_runtime_evidence_acceptance_gate_is_rejected,
        test_removing_confirmed_challenge_acceptance_is_rejected,
        test_removing_safe_value_deposit_boundary_is_rejected,
        test_removing_unallocated_funding_recovery_is_rejected,
        test_removing_funding_debit_is_rejected,
        test_removing_minimum_escrow_seal_gate_is_rejected,
        test_removing_validator_status_consensus_is_rejected,
        test_removing_bounded_status_vocabulary_is_rejected,
        test_removing_challenge_uncertainty_clock_is_rejected,
        test_removing_check_run_response_completeness_is_rejected,
        test_removing_sponsor_required_check_policy_is_rejected,
        test_removing_per_check_commit_binding_is_rejected,
        test_removing_runtime_policy_commitment_is_rejected,
    ]
    for test in tests:
        test()
    print(f"Mutation control passed: {len(tests)} critical mutations rejected.")
