import base64
import json
import sys
from pathlib import Path

import pytest


WEI = 10**18


def set_time(vm, value):
    vm.warp(value)
    try:
        import genlayer
        if isinstance(getattr(genlayer.message, "raw", None), dict):
            genlayer.message.raw["datetime"] = value
    except Exception:
        pass


def open_release(contract, vm, terms):
    set_time(vm, "2026-10-01T10:00:00Z")
    vm.sender, vm.value = terms["sponsor"], 0
    receipt = contract.open_release(
        terms["repo"], terms["ref"], terms["baseline"], terms["implementer"], "Session safety release",
        json.dumps(["The authorization boundary is preserved."]), json.dumps(["src"]), terms["seal_by"],
    )
    vm.value = 2 * WEI
    contract.deposit_funding()
    vm.value = 0
    contract.sponsor(1, 2 * WEI)
    return receipt


def test_open_release_freezes_terms_and_escrow(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    receipt = json.loads(open_release(contract, direct_vm, terms))
    assert receipt == {"release_id": 1, "state": "DRAFT"}
    stored = json.loads(contract.get_release(1))
    assert stored["escrow"] == 2 * WEI
    assert stored["scope"] == ["src"]


def test_open_release_normalizes_genlayer_address_arguments(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    module = sys.modules[contract.__class__.__module__]
    set_time(direct_vm, "2026-10-01T10:00:00Z")
    direct_vm.sender, direct_vm.value = terms["sponsor"], 0
    contract.open_release(
        terms["repo"], terms["ref"], terms["baseline"], module.Address(terms["implementer"]), "Address boundary",
        '["Normalize the runtime address type."]', '["src"]', terms["seal_by"],
    )
    assert json.loads(contract.get_release(1))["implementer"] == terms["implementer"]


def test_seal_binds_scoped_baseline_changes_and_runtime_checks(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    module = sys.modules[contract.__class__.__module__]
    item = {"repo": terms["repo"], "ref": terms["ref"], "baseline": terms["baseline"], "scope": ["src"]}
    commit = "b" * 40
    original = module.read_json
    def response(url):
        if "/branches/" in url: return {"commit": {"sha": commit}}
        if url.endswith("/commits/" + commit): return {"sha": commit, "commit": {"tree": {"sha": "c" * 40}}}
        if url.endswith("/commits/" + terms["baseline"]): return {"sha": terms["baseline"], "commit": {"tree": {"sha": "d" * 40}}}
        if "/compare/" + commit + "..." + commit in url: return {"merge_base_commit": {"sha": commit}}
        if "/compare/" + terms["baseline"] + "..." + commit in url: return {"merge_base_commit": {"sha": terms["baseline"]}, "files": [{"filename": "src/a.py", "status": "modified", "sha": "e" * 40, "additions": 2, "deletions": 1, "changes": 3}]}
        if url.endswith("/commits/" + commit + "/check-runs"): return {"head_sha": commit, "check_runs": [{"name": "tests", "status": "completed", "conclusion": "success", "html_url": "https://example.test/check"}]}
        raise AssertionError(url)
    module.read_json = response
    try:
        seal = contract._seal_source(item, commit)
    finally:
        module.read_json = original
    assert module.valid_seal(seal)
    assert seal["runtime_state"] == "PASS"
    assert seal["changes"][0]["path"] == "src/a.py"
    assert len(seal["change_root"]) == 64 and len(seal["runtime_root"]) == 64


def test_only_draft_state_accepts_new_sponsorship(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    direct_vm.sender, direct_vm.value = "0x3333333333333333333333333333333333333333", WEI
    assert contract.deposit_funding() == str(WEI)
    direct_vm.value = 0
    assert contract.sponsor(1, WEI) == "funded"
    assert json.loads(contract.get_release(1))["escrow"] == 3 * WEI


def test_value_deposit_is_recorded_before_allocation_and_remains_recoverable(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    direct_vm.sender, direct_vm.value = terms["sponsor"], WEI
    assert contract.deposit_funding() == str(WEI)
    assert int(contract.get_funding_balance(terms["sponsor"])) == WEI
    direct_vm.value = 0
    with pytest.raises(Exception):
        contract.sponsor(999, WEI)
    assert int(contract.get_funding_balance(terms["sponsor"])) == WEI
    transfers = []
    module = sys.modules[contract.__class__.__module__]
    module._Recipient = lambda address: type("Receiver", (), {"emit_transfer": lambda self, value: transfers.append(int(value))})()
    assert contract.withdraw_funding() == str(WEI)
    assert transfers == [WEI]
    assert int(contract.get_funding_balance(terms["sponsor"])) == 0


def test_unfunded_release_cannot_be_sealed(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    set_time(direct_vm, "2026-10-01T10:00:00Z")
    direct_vm.sender, direct_vm.value = terms["sponsor"], 0
    contract.open_release(terms["repo"], terms["ref"], terms["baseline"], terms["implementer"], "Unfunded", '["ok"]', '["src"]', terms["seal_by"])
    direct_vm.sender = terms["implementer"]
    with pytest.raises(Exception):
        contract.seal_release(1, "b" * 40)


def test_invalid_scope_fails_before_any_funding_is_attached(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    set_time(direct_vm, "2026-10-01T10:00:00Z")
    direct_vm.sender, direct_vm.value = terms["sponsor"], 0
    with pytest.raises(Exception):
        contract.open_release(terms["repo"], terms["ref"], terms["baseline"], terms["implementer"], "x", '["a"]', '["../escape"]', terms["seal_by"])


def test_first_credit_and_empty_withdraw_are_safe(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    item = json.loads(contract.get_release(1))
    item["state"] = "REVIEW"
    item["certificate"] = {"outcome": "ACCEPTED"}
    item["challenge_until"] = 0
    contract.releases[1] = json.dumps(item)
    direct_vm.sender, direct_vm.value = terms["implementer"], 0
    assert contract.finalize(1) == "ACCEPTED"
    assert int(contract.get_balance(terms["implementer"])) == 2 * WEI
    direct_vm.sender = "0x4444444444444444444444444444444444444444"
    assert contract.withdraw() == "nothing_to_withdraw"


def test_expiry_refund_credits_a_new_sponsor_balance(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    set_time(direct_vm, "2026-10-06T10:00:00Z")
    direct_vm.sender, direct_vm.value = terms["sponsor"], 0
    assert contract.expire_unsealed(1) == "EXPIRED"
    assert int(contract.get_balance(terms["sponsor"])) == 2 * WEI


def test_graph_components_and_complete_acceptance_lifecycle(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    item = json.loads(contract.get_release(1))
    item.update({"state": "MATERIALIZED", "inventory_count": 2, "materialized_count": 2, "seal": {"runtime_state": "PASS", "runtime_checks": [{"name": "tests", "status": "completed", "conclusion": "success"}]}})
    contract.releases[1] = json.dumps(item)
    contract.entries["1:entry:0"] = json.dumps({"path": "src/a.py", "blob": "a" * 40, "size": 20, "class": "TEXT", "status": "VERIFIED", "text": "import src.b"})
    contract.entries["1:entry:1"] = json.dumps({"path": "src/b.py", "blob": "b" * 40, "size": 8, "class": "TEXT", "status": "VERIFIED", "text": "VALUE = 1"})
    graph = json.loads(contract.build_review_graph(1))
    assert graph == {"components": 1, "edges": 1}
    module = sys.modules[contract.__class__.__module__]
    original = module.result_from_model
    module.result_from_model = lambda prompt: {"result": "ACCEPT", "statuses": ["met"], "rationale": "verified"}
    try:
        assert json.loads(contract.assess_component(1, 0))["result"] == "ACCEPT"
        assert json.loads(contract.review_edge(1, 0))["status"] == "ACCEPT"
    finally:
        module.result_from_model = original
    certificate = json.loads(contract.propose(1))
    assert certificate["outcome"] == "ACCEPTED"
    assert certificate["coverage"] == [2, 2, 1, 1, 1, 1]
    assert certificate["agreement_root"]


def test_indeterminate_release_becomes_refundable(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    item = json.loads(contract.get_release(1))
    item.update({"state": "REVIEW", "certificate": {"outcome": "INDETERMINATE"}, "indeterminate_until": 1791453600})
    contract.releases[1] = json.dumps(item)
    set_time(direct_vm, "2026-10-08T09:59:59Z")
    with pytest.raises(Exception):
        contract.refund_indeterminate(1)
    assert int(contract.get_balance(terms["sponsor"])) == 0
    set_time(direct_vm, "2026-10-08T10:00:00Z")
    assert contract.refund_indeterminate(1) == "REFUNDED"
    assert int(contract.get_balance(terms["sponsor"])) == 2 * WEI


def test_missing_or_mismatched_blob_fails_closed(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    item = json.loads(contract.get_release(1))
    item.update({"state": "MATERIALIZED", "inventory_count": 1, "materialized_count": 0})
    contract.releases[1] = json.dumps(item)
    contract.entries["1:entry:0"] = json.dumps({"path": "src/a.py", "blob": "a" * 40, "size": 4, "class": "TEXT", "status": "PENDING"})
    module = sys.modules[contract.__class__.__module__]
    original = module.read_json
    module.read_json = lambda _url: {"content": base64.b64encode(b"nope").decode()}
    try:
        assert contract.materialize(1, 0) == "BLOCKED"
    finally:
        module.read_json = original
    stored = json.loads(contract.get_release(1))
    assert stored["materialized_count"] == 1
    assert stored["blockers"] == ["blob_verification_failed"]


def test_unsupported_content_cannot_accept(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    item = json.loads(contract.get_release(1))
    item.update({"state": "MATERIALIZED", "inventory_count": 1, "materialized_count": 0})
    contract.releases[1] = json.dumps(item)
    contract.entries["1:entry:0"] = json.dumps({"path": "src/image.png", "blob": "a" * 40, "size": 4, "class": "BINARY", "status": "PENDING"})
    assert contract.materialize(1, 0) == "classified"
    assert json.loads(contract.build_review_graph(1)) == {"components": 1, "edges": 0}
    assert json.loads(contract.assess_component(1, 0))["result"] == "BLOCKED"
    certificate = json.loads(contract.propose(1))
    assert certificate["outcome"] == "INDETERMINATE"
    assert certificate["blockers"] == ["non_text_requires_explicit_attestation"]


def test_exhausted_import_budget_cannot_accept(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    item = json.loads(contract.get_release(1))
    item.update({"state": "MATERIALIZED", "inventory_count": 1, "materialized_count": 1})
    contract.releases[1] = json.dumps(item)
    imports = "\n".join(f'import "./missing-{index}";' for index in range(33))
    contract.entries["1:entry:0"] = json.dumps({"path": "src/a.ts", "blob": "a" * 40, "size": len(imports), "class": "TEXT", "status": "VERIFIED", "text": imports})
    contract.build_review_graph(1)
    stored = json.loads(contract.get_release(1))
    assert "import_cap:src/a.ts" in stored["blockers"]


def test_rejection_refunds_sponsor_and_withdraw_uses_checks_effects(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    item = json.loads(contract.get_release(1))
    item.update({"state": "REVIEW", "certificate": {"outcome": "REJECTED"}, "challenge_until": 0})
    contract.releases[1] = json.dumps(item)
    assert contract.finalize(1) == "REJECTED"
    assert int(contract.get_balance(terms["sponsor"])) == 2 * WEI
    assert int(contract.get_balance(terms["implementer"])) == 0
    module = sys.modules[contract.__class__.__module__]
    transfers = []
    original = module._Recipient
    module._Recipient = lambda address: type("Receiver", (), {"emit_transfer": lambda self, value: transfers.append(int(value))})()
    try:
        direct_vm.sender = terms["sponsor"]
        assert contract.withdraw() == str(2 * WEI)
    finally:
        module._Recipient = original
    assert transfers == [2 * WEI]
    assert int(contract.get_balance(terms["sponsor"])) == 0
    assert contract.withdraw() == "nothing_to_withdraw"
    assert transfers == [2 * WEI]


def test_finalize_cannot_pay_early_or_twice(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    item = json.loads(contract.get_release(1))
    item.update({"state": "REVIEW", "certificate": {"outcome": "ACCEPTED"}, "challenge_until": 1893456000})
    contract.releases[1] = json.dumps(item)
    with pytest.raises(Exception):
        contract.finalize(1)
    assert int(contract.get_balance(terms["implementer"])) == 0
    item["challenge_until"] = 0
    contract.releases[1] = json.dumps(item)
    assert contract.finalize(1) == "ACCEPTED"
    assert int(contract.get_balance(terms["implementer"])) == 2 * WEI
    with pytest.raises(Exception):
        contract.finalize(1)
    assert int(contract.get_balance(terms["implementer"])) == 2 * WEI


def test_only_implementer_can_seal_and_challenge_roles_are_reciprocal(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    direct_vm.sender = terms["sponsor"]
    with pytest.raises(Exception):
        contract.seal_release(1, "b" * 40)
    item = json.loads(contract.get_release(1))
    item.update({"state": "REVIEW", "inventory_count": 1, "certificate": {"outcome": "ACCEPTED"}, "challenge_until": 1893456000})
    contract.releases[1] = json.dumps(item)
    contract.entries["1:entry:0"] = json.dumps({"path": "src/a.py", "status": "VERIFIED"})
    direct_vm.sender = terms["implementer"]
    with pytest.raises(Exception):
        contract.challenge_certificate(1, 0, "implementer cannot challenge acceptance")
    item["certificate"] = {"outcome": "REJECTED"}
    contract.releases[1] = json.dumps(item)
    direct_vm.sender = terms["sponsor"]
    with pytest.raises(Exception):
        contract.challenge_certificate(1, 0, "sponsor cannot challenge rejection")


def test_truncated_inventory_fails_closed(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    item = json.loads(contract.get_release(1))
    item.update({"state": "INVENTORY", "seal": {"tree": "b" * 40}, "inventory_discovered": False})
    contract.releases[1] = json.dumps(item)
    module = sys.modules[contract.__class__.__module__]
    original = module.read_json
    module.read_json = lambda _url: {"sha": "b" * 40, "truncated": True, "tree": []}
    try:
        assert contract.discover_inventory(1) == "tree_unavailable_or_truncated"
    finally:
        module.read_json = original
    stored = json.loads(contract.get_release(1))
    assert stored["inventory_count"] == 0
    assert stored["blockers"] == ["incomplete_tree_inventory"]


def test_directory_nodes_are_navigation_not_unsupported_evidence(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    item = json.loads(contract.get_release(1))
    item.update({"state": "INVENTORY", "seal": {"tree": "b" * 40}, "inventory_discovered": False})
    contract.releases[1] = json.dumps(item)
    module = sys.modules[contract.__class__.__module__]
    original = module.read_json
    module.read_json = lambda _url: {"sha": "b" * 40, "truncated": False, "tree": [
        {"path": "src", "type": "tree", "sha": "c" * 40, "size": 0},
        {"path": "src/a.py", "type": "blob", "sha": "d" * 40, "size": 8},
    ]}
    try:
        result = json.loads(contract.discover_inventory(1))
    finally:
        module.read_json = original
    assert result == {"blockers": [], "inventory_count": 1}
    assert json.loads(contract.get_entry(1, 0))["path"] == "src/a.py"


def test_incomplete_obligation_statuses_cannot_accept(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    item = json.loads(contract.get_release(1))
    item.update({"state": "MATERIALIZED", "obligations": ["first", "second"], "inventory_count": 1, "materialized_count": 1})
    contract.releases[1] = json.dumps(item)
    contract.entries["1:entry:0"] = json.dumps({"path": "src/a.py", "blob": "a" * 40, "size": 8, "class": "TEXT", "status": "VERIFIED", "text": "VALUE=1"})
    contract.build_review_graph(1)
    module = sys.modules[contract.__class__.__module__]
    original = module.result_from_model
    module.result_from_model = lambda _prompt: {"result": "ACCEPT", "statuses": ["met"], "rationale": "omitted second obligation"}
    try:
        assessment = json.loads(contract.assess_component(1, 0))
    finally:
        module.result_from_model = original
    assert assessment["result"] == "UNCERTAIN"
    assert json.loads(contract.propose(1))["outcome"] == "INDETERMINATE"


@pytest.mark.parametrize("status", ["NOT_MET", "UNCERTAIN"])
def test_accept_with_non_met_status_cannot_create_accepted_certificate(direct_deploy, direct_vm, terms, status):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    item = json.loads(contract.get_release(1))
    item.update({"state": "MATERIALIZED", "inventory_count": 1, "materialized_count": 1})
    contract.releases[1] = json.dumps(item)
    contract.entries["1:entry:0"] = json.dumps({"path": "src/a.py", "blob": "a" * 40, "size": 8, "class": "TEXT", "status": "VERIFIED", "text": "VALUE=1"})
    contract.build_review_graph(1)
    module = sys.modules[contract.__class__.__module__]
    original = module.result_from_model
    module.result_from_model = lambda _prompt: {"result": "ACCEPT", "statuses": [status], "rationale": "contradictory verdict"}
    try:
        assessment = json.loads(contract.assess_component(1, 0))
    finally:
        module.result_from_model = original
    assert assessment["result"] == "UNCERTAIN"
    assert assessment["statuses"] == [status]
    assert json.loads(contract.propose(1))["outcome"] == "INDETERMINATE"


@pytest.mark.parametrize("status", ["NOT_MET", "UNCERTAIN"])
def test_certificate_aggregation_rechecks_every_obligation_status(direct_deploy, direct_vm, terms, status):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    item = json.loads(contract.get_release(1))
    item.update({"state": "ATTESTING", "inventory_count": 1, "materialized_count": 1, "component_count": 1, "assessed_count": 1})
    contract.releases[1] = json.dumps(item)
    contract.entries["1:entry:0"] = json.dumps({"path": "src/a.py", "blob": "a" * 40, "size": 8, "class": "TEXT", "status": "VERIFIED"})
    contract.components["1:component:0"] = json.dumps({"entries": [0], "paths": ["src/a.py"], "status": "ACCEPT", "assessment": {"result": "ACCEPT", "statuses": [status], "rationale": "forged contradictory assessment"}})
    assert json.loads(contract.propose(1))["outcome"] == "INDETERMINATE"


@pytest.mark.parametrize("runtime", [None, {"runtime_state": "ABSENT", "runtime_checks": []}, {"runtime_state": "PENDING", "runtime_checks": [{"name": "tests", "status": "in_progress", "conclusion": ""}]}, {"runtime_state": "FAIL", "runtime_checks": [{"name": "tests", "status": "completed", "conclusion": "failure"}]}])
def test_missing_pending_or_failed_runtime_evidence_cannot_accept(direct_deploy, direct_vm, terms, runtime):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    item = json.loads(contract.get_release(1))
    item.update({"state": "ATTESTING", "inventory_count": 1, "materialized_count": 1, "component_count": 1, "assessed_count": 1, "seal": runtime})
    contract.releases[1] = json.dumps(item)
    contract.entries["1:entry:0"] = json.dumps({"path": "src/a.py", "blob": "a" * 40, "size": 8, "class": "TEXT", "status": "VERIFIED"})
    contract.components["1:component:0"] = json.dumps({"entries": [0], "paths": ["src/a.py"], "status": "ACCEPT", "assessment": {"result": "ACCEPT", "statuses": ["MET"], "rationale": "semantic pass"}})
    assert json.loads(contract.propose(1))["outcome"] == "INDETERMINATE"


def test_confirmed_acceptance_challenge_preserves_acceptance(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    item = json.loads(contract.get_release(1))
    item.update({"state": "REVIEW", "inventory_count": 1, "component_count": 1, "certificate": {"outcome": "ACCEPTED"}, "challenge_until": 1893456000})
    contract.releases[1] = json.dumps(item)
    contract.entries["1:entry:0"] = json.dumps({"path": "src/a.py", "status": "VERIFIED", "text": "VALUE=1"})
    contract.components["1:component:0"] = json.dumps({"entries": [0], "paths": ["src/a.py"], "status": "ACCEPT"})
    direct_vm.sender = terms["sponsor"]
    contract.challenge_certificate(1, 0, "recheck accepted evidence")
    module = sys.modules[contract.__class__.__module__]
    original = module.result_from_model
    module.result_from_model = lambda _prompt: {"result": "ACCEPT", "statuses": ["MET"], "rationale": "still valid"}
    try:
        certificate = json.loads(contract.review_challenge(1))
    finally:
        module.result_from_model = original
    assert certificate["outcome"] == "ACCEPTED"


def test_challenge_missing_statuses_fails_closed_and_starts_seven_day_clock(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    item = json.loads(contract.get_release(1))
    item.update({"state": "REVIEW", "inventory_count": 1, "component_count": 1, "certificate": {"outcome": "ACCEPTED"}, "challenge_until": 1893456000})
    contract.releases[1] = json.dumps(item)
    contract.entries["1:entry:0"] = json.dumps({"path": "src/a.py", "status": "VERIFIED", "text": "VALUE=1"})
    contract.components["1:component:0"] = json.dumps({"entries": [0], "paths": ["src/a.py"], "status": "ACCEPT"})
    direct_vm.sender = terms["sponsor"]
    contract.challenge_certificate(1, 0, "recheck incomplete semantic output")
    module = sys.modules[contract.__class__.__module__]
    original = module.result_from_model
    module.result_from_model = lambda _prompt: {"result": "ACCEPT", "statuses": [], "rationale": "missing status"}
    try:
        certificate = json.loads(contract.review_challenge(1))
    finally:
        module.result_from_model = original
    stored = json.loads(contract.get_release(1))
    assert certificate["outcome"] == "INDETERMINATE"
    assert stored["indeterminate_until"] - stored["challenge_until"] == 7 * 24 * 60 * 60
    with pytest.raises(Exception):
        contract.refund_indeterminate(1)


@pytest.mark.parametrize("status", ["NOT_MET", "UNCERTAIN"])
def test_challenge_accept_with_non_met_status_cannot_preserve_acceptance(direct_deploy, direct_vm, terms, status):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    item = json.loads(contract.get_release(1))
    item.update({"state": "REVIEW", "inventory_count": 1, "component_count": 1, "certificate": {"outcome": "ACCEPTED"}, "challenge_until": 1893456000})
    contract.releases[1] = json.dumps(item)
    contract.entries["1:entry:0"] = json.dumps({"path": "src/a.py", "status": "VERIFIED", "text": "VALUE=1"})
    contract.components["1:component:0"] = json.dumps({"entries": [0], "paths": ["src/a.py"], "status": "ACCEPT"})
    direct_vm.sender = terms["sponsor"]
    contract.challenge_certificate(1, 0, "recheck contradictory semantic result")
    module = sys.modules[contract.__class__.__module__]
    original = module.result_from_model
    module.result_from_model = lambda _prompt: {"result": "ACCEPT", "statuses": [status], "rationale": "contradictory verdict"}
    try:
        certificate = json.loads(contract.review_challenge(1))
    finally:
        module.result_from_model = original
    assert certificate["outcome"] == "INDETERMINATE"
    assert certificate["challenge"]["statuses"] == [status]


def test_unresolved_dependency_and_inconsistent_assessment_cannot_accept(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    item = json.loads(contract.get_release(1))
    item.update({"state": "MATERIALIZED", "inventory_count": 1, "materialized_count": 1})
    contract.releases[1] = json.dumps(item)
    contract.entries["1:entry:0"] = json.dumps({"path": "src/a.ts", "blob": "a" * 40, "size": 24, "class": "TEXT", "status": "VERIFIED", "text": 'import "./missing";'})
    assert json.loads(contract.build_review_graph(1)) == {"components": 1, "edges": 0}
    module = sys.modules[contract.__class__.__module__]
    original = module.result_from_model
    module.result_from_model = lambda _prompt: None
    try:
        assert json.loads(contract.assess_component(1, 0))["result"] == "UNCERTAIN"
    finally:
        module.result_from_model = original
    certificate = json.loads(contract.propose(1))
    assert certificate["outcome"] == "INDETERMINATE"
    assert certificate["blockers"] == ["unresolved_local_import:src/a.ts:./missing"]


def test_incomplete_coverage_and_invalid_certificate_cannot_settle(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    item = json.loads(contract.get_release(1))
    item.update({"state": "ATTESTING", "component_count": 1, "assessed_count": 0})
    contract.releases[1] = json.dumps(item)
    with pytest.raises(Exception):
        contract.propose(1)
    item.update({"state": "REVIEW", "certificate": {"outcome": "INDETERMINATE"}, "indeterminate_until": 1893456000})
    contract.releases[1] = json.dumps(item)
    with pytest.raises(Exception):
        contract.finalize(1)
    with pytest.raises(Exception):
        contract.refund_indeterminate(1)


def test_duplicate_inventory_discovery_is_rejected_before_remote_fetch(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    item = json.loads(contract.get_release(1))
    item.update({"state": "INVENTORY", "inventory_discovered": True})
    contract.releases[1] = json.dumps(item)
    with pytest.raises(Exception): contract.discover_inventory(1)


def test_release_text_inputs_are_bounded(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    set_time(direct_vm, "2026-10-01T10:00:00Z")
    direct_vm.sender, direct_vm.value = terms["sponsor"], WEI
    with pytest.raises(Exception):
        contract.open_release(terms["repo"], "x" * 121, terms["baseline"], terms["implementer"], "valid title", '["ok"]', '["src"]', terms["seal_by"])
    with pytest.raises(Exception):
        contract.open_release(terms["repo"], terms["ref"], terms["baseline"], terms["implementer"], "valid title", json.dumps(["x" * 1001]), '["src"]', terms["seal_by"])
    with pytest.raises(Exception):
        contract.open_release(terms["repo"], terms["ref"], terms["baseline"], terms["implementer"], "valid title", '["ok"]', json.dumps(["x" * 241]), terms["seal_by"])
