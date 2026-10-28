import ast
import re
from pathlib import Path


def resolver_source():
    tree = ast.parse((Path(__file__).parents[1] / "contracts" / "beacon.py").read_text())
    names = {"extension", "import_targets", "resolve_local_import", "local_reference"}
    nodes = [item for item in tree.body if isinstance(item, ast.FunctionDef) and item.name in names]
    module = ast.Module(body=nodes, type_ignores=[])
    namespace = {"re": re}
    exec(compile(module, "resolver", "exec"), namespace)
    return namespace


def test_relative_typescript_import_resolves_to_one_sealed_path():
    resolve = resolver_source()["resolve_local_import"]
    assert resolve("src/ui/card.tsx", "../lib/token", {"src/lib/token.ts"}) == "src/lib/token.ts"


def test_ambiguous_or_escaping_relative_import_fails_closed():
    resolve = resolver_source()["resolve_local_import"]
    assert resolve("src/a.ts", "./x", {"src/x.ts", "src/x.js"}) is None
    assert resolve("src/a.ts", "../../x", {"x.ts"}) is None


def test_javascript_side_effect_require_and_dynamic_imports_are_found():
    targets = resolver_source()["import_targets"]
    source = 'import "./setup"; const x = require("./x"); import("./lazy"); export { y } from "./y";'
    assert targets("src/a.ts", source) == ["./lazy", "./setup", "./x", "./y"]


def test_python_relative_and_multiple_imports_are_found_and_resolved():
    helpers = resolver_source()
    targets = helpers["import_targets"]("pkg/a.py", "from .service import run\nimport pkg.b, pkg.c as c\n")
    assert targets == [".service", "pkg.b", "pkg.c"]
    available = {"pkg/a.py", "pkg/service.py", "pkg/b.py", "pkg/c.py"}
    assert helpers["resolve_local_import"]("pkg/a.py", ".service", available) == "pkg/service.py"
    assert helpers["local_reference"]("pkg/a.py", "pkg.missing", available)


def test_seal_requires_commit_identifiers_and_evidence_roots():
    tree = ast.parse((Path(__file__).parents[1] / "contracts" / "beacon.py").read_text())
    nodes = [item for item in tree.body if isinstance(item, ast.FunctionDef) and item.name in {"sha", "root", "valid_seal"}]
    namespace = {"re": re, "MAX_PATHS": 192, "MAX_RUNTIME_CHECKS": 32}
    exec(compile(ast.Module(body=nodes, type_ignores=[]), "seal", "exec"), namespace)
    assert not namespace["valid_seal"]({})
    value = {key: "a" * 40 for key in ("commit", "tree", "baseline_tree", "observed_ref_head")}
    value.update({"change_root": "b" * 64, "runtime_root": "c" * 64, "runtime_policy_root": "d" * 64, "changes": [],
                  "runtime_checks": [{"name": "tests"}], "check_total": 1, "runtime_state": "PASS"})
    assert namespace["valid_seal"](value)
