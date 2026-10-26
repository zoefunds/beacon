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
    vm.sender, vm.value = terms["sponsor"], 2 * WEI
    return contract.open_release(
        terms["repo"], terms["ref"], terms["baseline"], terms["implementer"], "Session safety release",
        json.dumps(["The authorization boundary is preserved."]), json.dumps(["src"]), terms["seal_by"],
    )


def test_open_release_freezes_terms_and_escrow(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    receipt = json.loads(open_release(contract, direct_vm, terms))
    assert receipt == {"release_id": 1, "state": "DRAFT"}
    stored = json.loads(contract.get_release(1))
    assert stored["escrow"] == 2 * WEI
    assert stored["scope"] == ["src"]


def test_only_draft_state_accepts_new_sponsorship(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    direct_vm.sender, direct_vm.value = "0x3333333333333333333333333333333333333333", WEI
    assert contract.sponsor(1) == "funded"
    assert json.loads(contract.get_release(1))["escrow"] == 3 * WEI


def test_invalid_scope_and_insufficient_escrow_fail(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    set_time(direct_vm, "2026-10-01T10:00:00Z")
    direct_vm.sender, direct_vm.value = terms["sponsor"], WEI - 1
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
    item.update({"state": "MATERIALIZED", "inventory_count": 2, "materialized_count": 2})
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
    item.update({"state": "REVIEW", "certificate": {"outcome": "INDETERMINATE"}, "indeterminate_until": 1})
    contract.releases[1] = json.dumps(item)
    set_time(direct_vm, "2026-10-06T10:00:00Z")
    assert contract.refund_indeterminate(1) == "REFUNDED"
    assert int(contract.get_balance(terms["sponsor"])) == 2 * WEI


def test_rejection_refunds_sponsor_and_withdraw_uses_checks_effects(direct_deploy, direct_vm, terms):
    contract = direct_deploy(Path("contract/contracts/beacon.py"))
    open_release(contract, direct_vm, terms)
    item = json.loads(contract.get_release(1))
    item.update({"state": "REVIEW", "certificate": {"outcome": "REJECTED"}, "challenge_until": 0})
    contract.releases[1] = json.dumps(item)
    assert contract.finalize(1) == "REJECTED"
    assert int(contract.get_balance(terms["sponsor"])) == 2 * WEI
    module = sys.modules[contract.__class__.__module__]
    transfers = []
    original = module.gl.contract.get_at
    module.gl.contract.get_at = lambda address: type("Receiver", (), {"emit_transfer": lambda self, value: transfers.append(int(value))})()
    try:
        direct_vm.sender = terms["sponsor"]
        assert contract.withdraw() == str(2 * WEI)
    finally:
        module.gl.contract.get_at = original
    assert transfers == [2 * WEI]
    assert int(contract.get_balance(terms["sponsor"])) == 0


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
