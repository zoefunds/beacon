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


if __name__ == "__main__":
    tests = [
        test_removing_the_deadline_guard_is_rejected,
        test_removing_the_tree_truncation_guard_is_rejected,
        test_removing_blob_hash_validation_is_rejected,
        test_removing_dependency_acceptance_gate_is_rejected,
    ]
    for test in tests:
        test()
    print(f"Mutation control passed: {len(tests)} critical mutations rejected.")
