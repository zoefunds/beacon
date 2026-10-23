"""Source-level adversarial guard tests for contract invariants.

These tests deliberately inspect the deployed source surface for controls that
must not be weakened by later refactoring without an explicit protocol update.
"""
from pathlib import Path


SOURCE = Path(__file__).parents[1] / "contracts" / "beacon.py"


def source():
    return SOURCE.read_text(encoding="utf-8")


def test_release_is_sealed_before_deadline_and_not_resampled_afterward():
    text = source()
    assert 'if now() >= item["seal_by"]' in text
    begin = text.index("def begin_inventory")
    after_close = text[begin:]
    assert 'branches/{quote(ref, safe=\'\')}' not in after_close


def test_inventory_and_bytes_cannot_be_supplied_by_a_caller():
    text = source()
    assert "def discover_inventory(self, release_id: u256)" in text
    assert "?recursive=1" in text
    assert 'tree.get("truncated")' in text
    assert 'blob_sha(raw) != entry["blob"]' in text


def test_positive_outcome_requires_full_coverage_and_zero_blockers():
    text = source()
    assert "coverage_incomplete" in text
    assert 'not item["blockers"]' in text
    assert 'all(x == "ACCEPT" for x in results)' in text
    assert 'all(x == "ACCEPT" for x in edge_results)' in text
    assert '"edge_root": digest(reviewed_edges)' in text


def test_dependency_resolution_is_deterministic_and_mandatory():
    text = source()
    assert "def resolve_local_import" in text
    assert "unresolved_local_import" in text


def test_semantic_result_is_decided_by_validator_consensus():
    text = source()
    assert "gl.vm.run_nondet(leader, validator)" in text
    assert "gl.nondet.exec_prompt" in text
