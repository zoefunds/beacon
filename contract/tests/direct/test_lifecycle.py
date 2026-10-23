import json
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
