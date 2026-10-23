import os
from pathlib import Path

import pytest
from gltest.direct.loader import deploy_contract


DIRECT_VM_VERSION = "v0.3.0-rc7"


@pytest.fixture
def direct_deploy(direct_vm, tmp_path):
    def deploy(contract_path, *args, **kwargs):
        source = Path(contract_path).read_text(encoding="utf-8")
        source = source.replace(
            'py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6',
            'py-genlayer:1zr6nqk597d97kg0dyxg0shhrykx5v02zjgnyrajapy4wlqvfvwh',
            1,
        ).replace("from genlayer import *", "import genlayer as gl\nfrom genlayer import Address, TreeMap, u256", 1).replace(
            "class Beacon(gl.Contract):", "class Beacon(gl.contract.Contract):", 1
        ).replace('gl.message_raw["datetime"]', 'gl.message.raw["datetime"]', 1).replace(
            "gl.message.sender", "gl.message.sender_address"
        ).replace(
            "gl.get_contract_at(", "gl.contract.get_at(", 1
        )
        # Direct Mode does not synthesize storage layouts for generic TreeMap
        # constructor calls. Plain dicts preserve the mapping behaviour needed
        # by these lifecycle tests; production storage remains TreeMap-backed.
        for name in ("releases", "entries", "edges", "components", "balances"):
            source = source.replace(f"self.{name} = TreeMap[u256, str]()", f"self.{name} = {{}}").replace(
                f"self.{name} = TreeMap[str, str]()", f"self.{name} = {{}}"
            ).replace(f"self.{name} = TreeMap[str, u256]()", f"self.{name} = {{}}")
        adapter = tmp_path / "beacon_direct_adapter.py"
        adapter.write_text(source, encoding="utf-8", newline="\n")
        return deploy_contract(adapter.resolve(), direct_vm, *args, sdk_version=DIRECT_VM_VERSION, **kwargs)
    return deploy


@pytest.fixture
def terms():
    return {
        "repo": "harbor/release-kit",
        "ref": "main",
        "baseline": "a" * 40,
        "implementer": "0x1111111111111111111111111111111111111111",
        "sponsor": "0x2222222222222222222222222222222222222222",
        "seal_by": 1791201600,
    }
