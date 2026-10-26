"""Prove the protocol guard rejects security-critical source mutations."""
import os
import subprocess
import tempfile
from pathlib import Path


ROOT = Path(__file__).parents[3]
SOURCE = ROOT / "contract" / "contracts" / "beacon.py"


def mutation_is_rejected(needle: str, replacement: str) -> bool:
    source = SOURCE.read_text(encoding="utf-8")
    assert needle in source, f"mutation target absent: {needle}"
    with tempfile.NamedTemporaryFile("w", suffix=".py", encoding="utf-8", delete=False) as handle:
        handle.write(source.replace(needle, replacement, 1))
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
    ]
    for test in tests:
        test()
    print(f"Mutation control passed: {len(tests)} critical mutations rejected.")
