import ast
from pathlib import Path


def resolver_source():
    tree = ast.parse((Path(__file__).parents[1] / "contracts" / "beacon.py").read_text())
    node = next(item for item in tree.body if isinstance(item, ast.FunctionDef) and item.name == "resolve_local_import")
    module = ast.Module(body=[node], type_ignores=[])
    namespace = {"extension": lambda path: path.rsplit(".", 1)[-1] if "." in path else ""}
    exec(compile(module, "resolver", "exec"), namespace)
    return namespace["resolve_local_import"]


def test_relative_typescript_import_resolves_to_one_sealed_path():
    resolve = resolver_source()
    assert resolve("src/ui/card.tsx", "../lib/token", {"src/lib/token.ts"}) == "src/lib/token.ts"


def test_ambiguous_or_escaping_relative_import_fails_closed():
    resolve = resolver_source()
    assert resolve("src/a.ts", "./x", {"src/x.ts", "src/x.js"}) is None
    assert resolve("src/a.ts", "../../x", {"x.ts"}) is None
