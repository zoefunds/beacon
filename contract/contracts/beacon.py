# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""Beacon — pre-sealed release attestations with complete evidence coverage."""
from genlayer import *
import base64
import hashlib
import json
import re
from datetime import datetime
from urllib.parse import quote

MIN_ESCROW = 10**18
MAX_OBLIGATIONS = 6
MAX_SCOPE = 8
MAX_PATHS = 192
MAX_BLOB_BYTES = 48000
MAX_COMPONENTS = 96
MAX_EDGES = 256
CHALLENGE_SECONDS = 20 * 60
INDETERMINATE_REFUND_SECONDS = 7 * 24 * 60 * 60
MAX_REF_CHARS = 120
MAX_TITLE_CHARS = 120
MAX_OBLIGATION_CHARS = 1000
MAX_SCOPE_PATH_CHARS = 240
MAX_COMPONENT_SOURCE_CHARS = 30000
MAX_IMPORTS_PER_FILE = 32
MAX_RUNTIME_CHECKS = 32

TEXT_EXTENSIONS = {"py", "js", "jsx", "ts", "tsx", "json", "md", "yml", "yaml", "toml", "css", "html", "sh", "txt"}
TERMINAL = {"ACCEPTED", "REJECTED", "EXPIRED", "REFUNDED"}

def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":"))

def digest(value):
    return hashlib.sha256(canonical(value).encode()).hexdigest()

def now():
    raw = gl.message_raw["datetime"].replace("Z", "+00:00")
    return int(datetime.fromisoformat(raw).timestamp())

def wallet(value):
    return value.as_hex.lower() if isinstance(value, Address) else str(value).lower()

def sha(value):
    return bool(re.fullmatch(r"[0-9a-fA-F]{40}", value or ""))

def root(value):
    return bool(re.fullmatch(r"[0-9a-fA-F]{64}", value or ""))

def valid_seal(value):
    return (isinstance(value, dict) and
            all(sha(str(value.get(key, ""))) for key in ("commit", "tree", "baseline_tree", "observed_ref_head")) and
            all(root(str(value.get(key, ""))) for key in ("change_root", "runtime_root")) and
            isinstance(value.get("changes"), list) and isinstance(value.get("runtime_checks"), list) and
            len(value["changes"]) <= MAX_PATHS and len(value["runtime_checks"]) <= MAX_RUNTIME_CHECKS)

def repository(value):
    return bool(re.fullmatch(r"[A-Za-z0-9_.-]{1,100}/[A-Za-z0-9_.-]{1,100}", value or ""))

def path_ok(path):
    return bool(path and not path.startswith("/") and "\\" not in path and "\x00" not in path and
                all(p not in {"", ".", ".."} for p in path.split("/")))

def blob_sha(raw):
    return hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()

def read_json(url):
    try:
        response = gl.nondet.web.get(url)
        if int(getattr(response, "status", getattr(response, "status_code", 599))) != 200:
            return None
        body = response.body or b""
        return json.loads(body.decode() if isinstance(body, bytes) else str(body))
    except Exception:
        return None

def result_from_model(prompt):
    """Return a consensus-backed categorical semantic result.

    Explanation text is retained for the certificate UI, but validators compare
    the money-relevant category exactly.  A malformed result fails closed.
    """
    def normalize(raw):
        try:
            value = json.loads(raw) if isinstance(raw, str) else raw
            result = str(value.get("result", "")).upper()
            if not isinstance(value, dict) or result not in {"ACCEPT", "REJECT", "UNCERTAIN"}:
                return None
            statuses = value.get("statuses", [])
            if not isinstance(statuses, list) or len(statuses) > MAX_OBLIGATIONS:
                return None
            statuses = [str(x).upper() for x in statuses]
            if any(status not in {"MET", "NOT_MET", "UNCERTAIN"} for status in statuses):
                return None
            # An obligation-bearing ACCEPT is internally consistent only when
            # every ordered obligation status is MET. Edge verdicts carry an
            # intentionally empty status vector and are handled separately.
            if result == "ACCEPT" and statuses and any(status != "MET" for status in statuses):
                return None
            return {"result": result, "statuses": statuses, "rationale": str(value.get("rationale", ""))[:1200]}
        except Exception:
            return None
    def leader():
        value = normalize(gl.nondet.exec_prompt(prompt, response_format="json"))
        if value is None: raise gl.vm.UserError("invalid_semantic_result")
        return value
    def validator(leaders_res) -> bool:
        try:
            if not isinstance(leaders_res, gl.vm.Return): return False
            leader_value = normalize(leaders_res.calldata)
            validator_value = leader()
            return leader_value is not None and leader_value["result"] == validator_value["result"] and leader_value["statuses"] == validator_value["statuses"]
        except Exception:
            return False
    try:
        return gl.vm.run_nondet(leader, validator)
    except Exception:
        return None

def obligation_verdict(verdict, expected):
    """Normalize an obligation-bearing verdict and fail contradictory ACCEPT closed."""
    if not isinstance(verdict, dict):
        return {"result": "UNCERTAIN", "statuses": [], "rationale": "missing semantic verdict"}
    result = str(verdict.get("result", "UNCERTAIN")).upper()
    statuses = verdict.get("statuses", [])
    if (result not in {"ACCEPT", "REJECT", "UNCERTAIN"} or not isinstance(statuses, list) or
            len(statuses) != expected):
        return {"result": "UNCERTAIN", "statuses": [], "rationale": "incomplete obligation coverage"}
    statuses = [str(status).upper() for status in statuses]
    if any(status not in {"MET", "NOT_MET", "UNCERTAIN"} for status in statuses):
        return {"result": "UNCERTAIN", "statuses": [], "rationale": "invalid obligation status"}
    if result == "ACCEPT" and any(status != "MET" for status in statuses):
        return {"result": "UNCERTAIN", "statuses": statuses, "rationale": "ACCEPT requires every obligation status to be MET"}
    return {"result": result, "statuses": statuses, "rationale": str(verdict.get("rationale", ""))[:1200]}

def normalized_scope(raw):
    try: values = json.loads(raw)
    except Exception: raise gl.vm.UserError("invalid_scope")
    if not isinstance(values, list) or not 1 <= len(values) <= MAX_SCOPE or any(not isinstance(v, str) for v in values): raise gl.vm.UserError("invalid_scope")
    values = sorted(set(v.strip().rstrip("/") for v in values))
    if len(values) == 0 or any(not path_ok(v) or len(v) > MAX_SCOPE_PATH_CHARS for v in values): raise gl.vm.UserError("invalid_scope_path")
    return values

def in_scope(path, scopes):
    return any(path == item or path.startswith(item + "/") for item in scopes)

def extension(path):
    return path.rsplit(".", 1)[-1].lower() if "." in path else ""

def import_targets(path, text):
    """A deliberately conservative parser: unresolved local-looking imports block acceptance."""
    found = []
    if extension(path) == "py":
        for module, names in re.findall(r"^\s*from\s+([.A-Za-z_][A-Za-z0-9_.]*)\s+import\s+([^\n#]+)", text, re.MULTILINE):
            if module.strip("."):
                found.append(module)
            else:
                for name in names.split(","):
                    imported = name.strip().split()[0]
                    if re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", imported): found.append(module + imported)
        for clause in re.findall(r"^\s*import\s+([^\n#]+)", text, re.MULTILINE):
            for name in clause.split(","):
                module = name.strip().split()[0]
                if re.fullmatch(r"[A-Za-z_][A-Za-z0-9_.]*", module): found.append(module)
    elif extension(path) in {"js", "jsx", "ts", "tsx"}:
        patterns = [
            r"(?:from\s*|import\s*\()\s*[\"']([^\"']+)[\"']",
            r"\bimport\s*[\"']([^\"']+)[\"']",
            r"\brequire\s*\(\s*[\"']([^\"']+)[\"']\s*\)",
        ]
        for pattern in patterns:
            for item in re.findall(pattern, text):
                if item.startswith("."): found.append(item)
    return sorted(set(found))

def resolve_local_import(source, reference, available):
    """Resolve a parser-produced local import against the sealed inventory.

    A reference that might identify a repository file is never silently
    discarded.  The caller gets either one canonical path or an explicit
    unresolved/ambiguous result.
    """
    candidates = []
    if reference.startswith(".") and extension(source) != "py":
        base = source.rsplit("/", 1)[0] if "/" in source else ""
        parts = base.split("/") if base else []
        for bit in reference.split("/"):
            if bit in {"", "."}: continue
            if bit == "..":
                if not parts: return None
                parts.pop()
            else: parts.append(bit)
        stem = "/".join(parts)
        candidates = [stem, stem + ".ts", stem + ".tsx", stem + ".js", stem + ".jsx", stem + ".py", stem + "/index.ts", stem + "/index.tsx", stem + "/index.js", stem + "/__init__.py"]
    elif extension(source) == "py":
        if reference.startswith("."):
            dots = len(reference) - len(reference.lstrip("."))
            parts = source.rsplit("/", 1)[0].split("/") if "/" in source else []
            for _ in range(max(0, dots - 1)):
                if not parts: return None
                parts.pop()
            suffix = reference[dots:].replace(".", "/")
            stem = "/".join(parts + ([suffix] if suffix else []))
        else:
            stem = reference.replace(".", "/")
        candidates = [stem + ".py", stem + "/__init__.py"]
    matches = [candidate for candidate in candidates if candidate in available]
    return matches[0] if len(matches) == 1 else None

def local_reference(source, reference, available):
    if reference.startswith("."): return True
    if extension(source) != "py": return False
    root = reference.split(".", 1)[0]
    return any(path == root + ".py" or path.startswith(root + "/") for path in available)

@gl.evm.contract_interface
class _Recipient:
    class View:
        pass

    class Write:
        pass

class Beacon(gl.Contract):
    # Persistent maps must be declared as storage fields. Constructing them in
    # __init__ creates an ephemeral map in the current Studionet runtime.
    next_id: u256
    releases: TreeMap[u256, str]
    entries: TreeMap[str, str]
    edges: TreeMap[str, str]
    components: TreeMap[str, str]
    balances: TreeMap[str, u256]
    funding_balances: TreeMap[str, u256]

    def __init__(self):
        self.next_id = u256(1)

    def _key(self, release_id, kind, index): return f"{int(release_id)}:{kind}:{index}"
    def _load(self, release_id):
        if release_id not in self.releases: raise gl.vm.UserError("unknown_release")
        raw = self.releases[release_id]
        if not raw: raise gl.vm.UserError("unknown_release")
        return json.loads(raw)
    def _save(self, release_id, item): self.releases[release_id] = canonical(item)
    def _credit(self, account, amount):
        current = int(self.balances[account]) if account in self.balances else 0
        self.balances[account] = u256(current + amount)
    def _require(self, item, state):
        if item["state"] != state: raise gl.vm.UserError("invalid_state")
    def _seal_source(self, item, commit):
        repo, ref = item["repo"], item["ref"]
        branch = read_json(f"https://api.github.com/repos/{repo}/branches/{quote(ref, safe='')}")
        commit_data = read_json(f"https://api.github.com/repos/{repo}/commits/{commit}")
        baseline_data = read_json(f"https://api.github.com/repos/{repo}/commits/{item['baseline']}")
        if not isinstance(branch, dict) or not isinstance(commit_data, dict) or not isinstance(baseline_data, dict): return None
        tree = ((commit_data.get("commit") or {}).get("tree") or {}).get("sha", "").lower()
        head = ((branch.get("commit") or {}).get("sha") or "").lower()
        compare = read_json(f"https://api.github.com/repos/{repo}/compare/{commit}...{head}")
        baseline_compare = read_json(f"https://api.github.com/repos/{repo}/compare/{item['baseline']}...{commit}")
        checks_data = read_json(f"https://api.github.com/repos/{repo}/commits/{commit}/check-runs")
        baseline_tree = str(((baseline_data.get("commit") or {}).get("tree") or {}).get("sha", "")).lower()
        if str(commit_data.get("sha", "")).lower() != commit.lower() or str(baseline_data.get("sha", "")).lower() != item["baseline"] or not sha(tree) or not sha(head) or not sha(baseline_tree): return None
        if not isinstance(compare, dict) or str(((compare.get("merge_base_commit") or {}).get("sha") or "")).lower() != commit.lower(): return None
        if not isinstance(baseline_compare, dict) or str(((baseline_compare.get("merge_base_commit") or {}).get("sha") or "")).lower() != item["baseline"]: return None
        files = baseline_compare.get("files")
        check_runs = (checks_data or {}).get("check_runs") if isinstance(checks_data, dict) else None
        if not isinstance(files, list) or len(files) > MAX_PATHS or not isinstance(check_runs, list) or len(check_runs) > MAX_RUNTIME_CHECKS: return None
        changes = []
        for file in files:
            filename = str((file or {}).get("filename", "")); previous = str((file or {}).get("previous_filename", ""))
            if not path_ok(filename) or (previous and not path_ok(previous)): return None
            if not in_scope(filename, item["scope"]) and not (previous and in_scope(previous, item["scope"])): continue
            changes.append({"path": filename, "previous_path": previous, "status": str((file or {}).get("status", ""))[:24],
                            "blob": str((file or {}).get("sha", "")).lower(), "additions": int((file or {}).get("additions", 0)),
                            "deletions": int((file or {}).get("deletions", 0)), "changes": int((file or {}).get("changes", 0))})
        if str(checks_data.get("head_sha", "")).lower() != commit.lower(): return None
        runtime_checks = []
        for check in check_runs:
            runtime_checks.append({"name": str((check or {}).get("name", ""))[:120], "status": str((check or {}).get("status", ""))[:24],
                                   "conclusion": str((check or {}).get("conclusion", ""))[:24],
                                   "url": str((check or {}).get("html_url", ""))[:300]})
        runtime_state = ("ABSENT" if not runtime_checks else
                         ("PASS" if all(check["status"] == "completed" and check["conclusion"] == "success" for check in runtime_checks) else
                          ("PENDING" if any(check["status"] != "completed" for check in runtime_checks) else "FAIL")))
        return {"commit": commit.lower(), "tree": tree, "baseline_tree": baseline_tree, "observed_ref_head": head,
                "changes": sorted(changes, key=lambda value: (value["path"], value["previous_path"])),
                "runtime_checks": sorted(runtime_checks, key=lambda value: value["name"]), "runtime_state": runtime_state,
                "change_root": digest(sorted(changes, key=lambda value: (value["path"], value["previous_path"]))),
                "runtime_root": digest(sorted(runtime_checks, key=lambda value: value["name"]))}

    @gl.public.write
    def open_release(self, repo: str, ref: str, baseline: str, implementer: str, title: str, obligations_json: str, scope_json: str, seal_by: int) -> str:
        implementer_address = str(implementer)
        if not repository(repo) or not sha(baseline) or not re.fullmatch(r"0x[0-9a-fA-F]{40}", implementer_address): raise gl.vm.UserError("invalid_identity")
        if not 1 <= len(ref.strip()) <= MAX_REF_CHARS or any(value in ref for value in ("..", "?", "#", "\x00")): raise gl.vm.UserError("invalid_ref")
        if not 1 <= len(title.strip()) <= MAX_TITLE_CHARS: raise gl.vm.UserError("invalid_title")
        if seal_by <= now() + 300: raise gl.vm.UserError("seal_time_too_soon")
        try: obligations = json.loads(obligations_json)
        except Exception: raise gl.vm.UserError("invalid_obligations")
        if not isinstance(obligations, list) or not 1 <= len(obligations) <= MAX_OBLIGATIONS or any(not isinstance(x, str) or not x.strip() or len(x.strip()) > MAX_OBLIGATION_CHARS for x in obligations): raise gl.vm.UserError("invalid_obligations")
        release_id = self.next_id; self.next_id = u256(int(release_id) + 1)
        item = {"id": int(release_id), "state": "DRAFT", "repo": repo, "ref": ref.strip(), "baseline": baseline.lower(), "implementer": implementer_address.lower(), "sponsors": {}, "escrow": 0, "title": title.strip(), "obligations": [str(x).strip() for x in obligations], "scope": normalized_scope(scope_json), "seal_by": seal_by, "seal": None, "inventory_discovered": False, "inventory_count": 0, "materialized_count": 0, "component_count": 0, "assessed_count": 0, "edge_count": 0, "reviewed_edges": 0, "blockers": [], "challenge_until": 0, "indeterminate_until": 0, "challenge": None, "certificate": None}
        self._save(release_id, item)
        return canonical({"release_id": int(release_id), "state": "DRAFT"})

    @gl.public.write.payable
    def deposit_funding(self) -> str:
        # This is the only value-bearing entry point and deliberately has no
        # arguments or reverting validation. Studionet credits attached value
        # even when contract execution rolls back, so deposits must always be
        # recorded before a separate allocation transaction can validate.
        who = wallet(gl.message.sender_address)
        value = int(gl.message.value)
        current = int(self.funding_balances[who]) if who in self.funding_balances else 0
        self.funding_balances[who] = u256(current + value)
        return str(current + value)

    @gl.public.write
    def sponsor(self, release_id: u256, amount: u256) -> str:
        item = self._load(release_id); self._require(item, "DRAFT")
        value = int(amount); who = wallet(gl.message.sender_address)
        available = int(self.funding_balances[who]) if who in self.funding_balances else 0
        if value <= 0 or value > available: raise gl.vm.UserError("insufficient_funding_balance")
        self.funding_balances[who] = u256(available - value)
        item["sponsors"][who] = item["sponsors"].get(who, 0) + value; item["escrow"] += value
        self._save(release_id, item); return "funded"

    @gl.public.write
    def seal_release(self, release_id: u256, commit: str) -> str:
        item = self._load(release_id)
        if item["state"] not in {"DRAFT", "SEALED"}: raise gl.vm.UserError("invalid_state")
        if item["escrow"] < MIN_ESCROW: raise gl.vm.UserError("minimum_escrow")
        if wallet(gl.message.sender_address) != item["implementer"]: raise gl.vm.UserError("implementer_only")
        if now() >= item["seal_by"] or not sha(commit): raise gl.vm.UserError("seal_closed")
        def fetch_seal(): return canonical(self._seal_source(item, commit) or {})
        try: seal = json.loads(gl.eq_principle.strict_eq(fetch_seal))
        except Exception: seal = None
        if not valid_seal(seal): raise gl.vm.UserError("unverifiable_seal")
        item["seal"] = seal; item["state"] = "SEALED"; self._save(release_id, item)
        return canonical(seal)

    @gl.public.write
    def begin_inventory(self, release_id: u256) -> str:
        item = self._load(release_id); self._require(item, "SEALED")
        if now() < item["seal_by"]: raise gl.vm.UserError("seal_window_open")
        # The sealed tree is frozen; post-deadline branch state is intentionally never fetched.
        item["state"] = "INVENTORY"; item["cursor"] = ["", item["seal"]["tree"]]; item["inventory_discovered"] = False; self._save(release_id, item)
        return "inventory_started"

    @gl.public.write
    def discover_inventory(self, release_id: u256) -> str:
        item = self._load(release_id); self._require(item, "INVENTORY")
        if item.get("inventory_discovered"): raise gl.vm.UserError("inventory_already_discovered")
        # The caller supplies no paths. The full sealed tree is fetched under consensus;
        # a truncated response cannot be mistaken for a complete release inventory.
        def fetch_tree():
            value = read_json(f"https://api.github.com/repos/{item['repo']}/git/trees/{item['seal']['tree']}?recursive=1")
            return canonical(value or {})
        try: tree = json.loads(gl.eq_principle.strict_eq(fetch_tree))
        except Exception: tree = None
        if not isinstance(tree, dict) or str(tree.get("sha", "")).lower() != item["seal"]["tree"] or tree.get("truncated"):
            item["blockers"].append("incomplete_tree_inventory"); self._save(release_id, item); return "tree_unavailable_or_truncated"
        entries = tree.get("tree")
        if not isinstance(entries, list): item["blockers"].append("malformed_tree_inventory"); self._save(release_id, item); return "malformed_tree"
        scope_hits = {scope: False for scope in item["scope"]}
        for entry in sorted(entries, key=lambda x: str((x or {}).get("path", ""))):
            if item["inventory_count"] >= MAX_PATHS: item["blockers"].append("inventory_cap"); break
            path = str((entry or {}).get("path", "")); kind = str((entry or {}).get("type", "")); blob = str((entry or {}).get("sha", "")).lower(); size = int((entry or {}).get("size", -1))
            if not in_scope(path, item["scope"]): continue
            for scope in item["scope"]:
                if path == scope or path.startswith(scope + "/"): scope_hits[scope] = True
            # Recursive Git trees contain directory nodes as navigation
            # metadata. Files and submodules are the evidence-bearing entries;
            # an ordinary directory must not become an unsupported blocker.
            if kind == "tree": continue
            if not path_ok(path) or not in_scope(path, item["scope"]) or kind not in {"blob", "commit"}: item["blockers"].append("unsupported_inventory_entry"); continue
            index = item["inventory_count"]; classification = "TEXT" if kind == "blob" and extension(path) in TEXT_EXTENSIONS else ("BINARY" if kind == "blob" else "SUBMODULE")
            self.entries[self._key(release_id, "entry", index)] = canonical({"path": path, "blob": blob, "size": size, "class": classification, "status": "PENDING"})
            item["inventory_count"] += 1
        for scope, found in scope_hits.items():
            if not found: item["blockers"].append("missing_scope:" + scope)
        item["inventory_discovered"] = True
        self._save(release_id, item); return canonical({"inventory_count": item["inventory_count"], "blockers": item["blockers"]})

    @gl.public.write
    def close_inventory(self, release_id: u256) -> str:
        item = self._load(release_id); self._require(item, "INVENTORY")
        if not item.get("inventory_discovered"): raise gl.vm.UserError("inventory_not_discovered")
        if item["inventory_count"] == 0: item["blockers"].append("empty_inventory")
        item["state"] = "MATERIALIZED"; self._save(release_id, item); return "inventory_closed"

    @gl.public.write
    def materialize(self, release_id: u256, entry_index: int) -> str:
        item = self._load(release_id); self._require(item, "MATERIALIZED")
        key = self._key(release_id, "entry", entry_index)
        if key not in self.entries: raise gl.vm.UserError("invalid_entry")
        entry = json.loads(self.entries[key] or "{}")
        if not entry or entry.get("status") != "PENDING": raise gl.vm.UserError("invalid_entry")
        if entry["class"] != "TEXT": entry["status"] = "CLASSIFIED"; item["materialized_count"] += 1; item["blockers"].append("non_text_requires_explicit_attestation"); self.entries[key] = canonical(entry); self._save(release_id, item); return "classified"
        def fetch_blob():
            value = read_json(f"https://api.github.com/repos/{item['repo']}/git/blobs/{entry['blob']}")
            return canonical(value or {})
        try: payload = json.loads(gl.eq_principle.strict_eq(fetch_blob))
        except Exception: payload = None
        try: raw = base64.b64decode(str(payload["content"]).replace("\n", ""), validate=True)
        except Exception: raw = b""
        if len(raw) != entry["size"] or len(raw) > MAX_BLOB_BYTES or blob_sha(raw) != entry["blob"]: item["blockers"].append("blob_verification_failed"); entry["status"] = "BLOCKED"
        else: entry["status"] = "VERIFIED"; entry["text"] = raw.decode("utf-8", errors="replace")
        item["materialized_count"] += 1
        self.entries[key] = canonical(entry); self._save(release_id, item); return entry["status"]

    @gl.public.write
    def build_review_graph(self, release_id: u256) -> str:
        item = self._load(release_id); self._require(item, "MATERIALIZED")
        if item["materialized_count"] != item["inventory_count"]: raise gl.vm.UserError("materialization_incomplete")
        paths = {}; entries = []; edges = []
        for i in range(item["inventory_count"]):
            entry = json.loads(self.entries[self._key(release_id, "entry", i)])
            paths[entry["path"]] = i
            entries.append(entry)
        for entry in entries:
            if entry["status"] != "VERIFIED": continue
            targets = import_targets(entry["path"], entry.get("text", ""))
            if len(targets) > MAX_IMPORTS_PER_FILE: item["blockers"].append("import_cap:" + entry["path"])
            for target in targets[:MAX_IMPORTS_PER_FILE]:
                # Local relative targets must resolve; a model cannot waive this condition.
                resolved = resolve_local_import(entry["path"], target, paths)
                # A relative JavaScript import must resolve. Python imports that
                # don't map to the sealed tree are external dependencies; a
                # Python name that has a local prefix but no unique target blocks.
                if local_reference(entry["path"], target, paths) and not resolved:
                    item["blockers"].append("unresolved_local_import:" + entry["path"] + ":" + target)
                elif resolved:
                    edges.append((entry["path"], resolved))
        unique_edges = sorted(set(edges))
        for index, edge in enumerate(unique_edges[:MAX_EDGES]): self.edges[self._key(release_id, "edge", index)] = canonical({"from": edge[0], "to": edge[1], "status": "PENDING"})
        if len(unique_edges) > MAX_EDGES: item["blockers"].append("edge_cap")
        parent = list(range(len(entries)))
        def root(index):
            while parent[index] != index:
                parent[index] = parent[parent[index]]
                index = parent[index]
            return index
        def join(left, right):
            left_root, right_root = root(left), root(right)
            if left_root != right_root: parent[max(left_root, right_root)] = min(left_root, right_root)
        for source, target in unique_edges:
            join(paths[source], paths[target])
        groups = {}
        for index in range(len(entries)):
            component_root = root(index)
            if component_root not in groups: groups[component_root] = []
            groups[component_root].append(index)
        ordered_groups = sorted(groups.values(), key=lambda group: entries[group[0]]["path"])
        if len(ordered_groups) > MAX_COMPONENTS: item["blockers"].append("component_cap")
        for index, group in enumerate(ordered_groups[:MAX_COMPONENTS]):
            self.components[self._key(release_id, "component", index)] = canonical({"entries": group, "paths": [entries[item]["path"] for item in group], "status": "PENDING"})
        item["edge_count"] = min(len(unique_edges), MAX_EDGES); item["component_count"] = min(len(ordered_groups), MAX_COMPONENTS); item["state"] = "ATTESTING"; self._save(release_id, item)
        return canonical({"components": item["component_count"], "edges": item["edge_count"]})

    @gl.public.write
    def assess_component(self, release_id: u256, component_index: int) -> str:
        item = self._load(release_id); self._require(item, "ATTESTING")
        key = self._key(release_id, "component", component_index)
        if key not in self.components: raise gl.vm.UserError("invalid_component")
        component = json.loads(self.components[key] or "{}")
        if not component or component.get("assessment"): raise gl.vm.UserError("already_assessed")
        entries = [json.loads(self.entries[self._key(release_id, "entry", index)] or "{}") for index in component.get("entries", [])]
        source = "\n\n".join("Path: " + entry.get("path", "") + "\n" + entry.get("text", "") for entry in entries)
        if not entries or any(entry.get("status") != "VERIFIED" for entry in entries): component["assessment"] = {"result": "BLOCKED", "statuses": []}
        elif len(source) > MAX_COMPONENT_SOURCE_CHARS:
            component["assessment"] = {"result": "BLOCKED", "statuses": []}
            item["blockers"].append("component_source_cap:" + str(component_index))
        else:
            status_example = ["MET" for _ in item["obligations"]]
            prompt = ("Classify this immutable release component against obligations. Return exactly one JSON object with keys result, statuses, and rationale. "
                      "result must be ACCEPT, REJECT, or UNCERTAIN. statuses must contain exactly " + str(len(item["obligations"])) +
                      " entries, in obligation order, using only MET, NOT_MET, or UNCERTAIN. Never omit statuses. Example shape: " +
                      canonical({"result": "ACCEPT", "statuses": status_example, "rationale": "brief evidence-based reason"}) +
                      " ACCEPT is valid only when every status is MET. Obligations: " + canonical(item["obligations"]) +
                      " Baseline-to-release changes: " + canonical((item.get("seal") or {}).get("changes", [])) +
                      " Public commit checks: " + canonical({"state": (item.get("seal") or {}).get("runtime_state", "ABSENT"), "checks": (item.get("seal") or {}).get("runtime_checks", [])}) +
                      " Component source: " + source)
            verdict = obligation_verdict(result_from_model(prompt), len(item["obligations"]))
            component["assessment"] = verdict
        component["status"] = component["assessment"]["result"]
        item["assessed_count"] += 1; self.components[key] = canonical(component); self._save(release_id, item); return canonical(component["assessment"])

    @gl.public.write
    def review_edge(self, release_id: u256, edge_index: int) -> str:
        item = self._load(release_id); self._require(item, "ATTESTING")
        key = self._key(release_id, "edge", edge_index)
        if key not in self.edges: raise gl.vm.UserError("invalid_edge")
        edge = json.loads(self.edges[key] or "{}")
        if not edge or edge["status"] != "PENDING": raise gl.vm.UserError("invalid_edge")
        from_entry = None; to_entry = None
        for index in range(item["inventory_count"]):
            candidate = json.loads(self.entries[self._key(release_id, "entry", index)] or "{}")
            if candidate.get("path") == edge["from"]: from_entry = candidate
            if candidate.get("path") == edge.get("to"): to_entry = candidate
        if not from_entry or not to_entry:
            edge["status"] = "BLOCKED"; item["blockers"].append("edge_source_missing")
        else:
            prompt = "Review compatibility of a sealed dependency edge. Reply JSON with result ACCEPT|REJECT|UNCERTAIN, statuses as an empty list, and a rationale. Consumer path/source: " + edge["from"] + "\n" + from_entry.get("text", "") + "\nProvider path/source: " + edge["to"] + "\n" + to_entry.get("text", "")
            verdict = result_from_model(prompt) or {"result": "UNCERTAIN"}
            edge["status"] = str(verdict.get("result", "UNCERTAIN")).upper()
        item["reviewed_edges"] += 1; self.edges[key] = canonical(edge); self._save(release_id, item); return canonical(edge)

    @gl.public.write
    def propose(self, release_id: u256) -> str:
        item = self._load(release_id); self._require(item, "ATTESTING")
        if item["assessed_count"] != item["component_count"] or item["reviewed_edges"] != item["edge_count"]: raise gl.vm.UserError("coverage_incomplete")
        results = []; inventory = []; assessments = []; reviewed_edges = []; obligation_vectors = []
        for i in range(item["inventory_count"]):
            entry = json.loads(self.entries[self._key(release_id, "entry", i)]); inventory.append({k: entry.get(k) for k in ("path", "blob", "size", "class", "status")})
        for i in range(item["component_count"]):
            component = json.loads(self.components[self._key(release_id, "component", i)]); assessments.append(component)
            assessment = component.get("assessment", {}); results.append(assessment.get("result", "BLOCKED")); obligation_vectors.append(assessment.get("statuses", []))
        for i in range(item["edge_count"]): reviewed_edges.append(json.loads(self.edges[self._key(release_id, "edge", i)]))
        edge_results = [edge.get("status", "BLOCKED") for edge in reviewed_edges]
        all_obligations_met = bool(obligation_vectors) and all(len(vector) == len(item["obligations"]) and all(status == "MET" for status in vector) for vector in obligation_vectors)
        runtime_evidence_passed = bool((item.get("seal") or {}).get("runtime_checks")) and (item.get("seal") or {}).get("runtime_state") == "PASS"
        accepted = not item["blockers"] and results and all(x == "ACCEPT" for x in results) and all_obligations_met and runtime_evidence_passed and all(x == "ACCEPT" for x in edge_results)
        rejected = "REJECT" in results or "REJECT" in edge_results
        outcome = "ACCEPTED" if accepted else ("REJECTED" if rejected else "INDETERMINATE")
        agreement = {key: item[key] for key in ("id", "repo", "ref", "baseline", "implementer", "sponsors", "escrow", "title", "obligations", "scope", "seal_by")}
        item["certificate"] = {"outcome": outcome, "agreement_root": digest(agreement), "seal_root": digest(item["seal"]), "inventory_root": digest(inventory), "assessment_root": digest(assessments), "edge_root": digest(reviewed_edges), "obligation_root": digest(item["obligations"]), "coverage": [item["inventory_count"], item["materialized_count"], item["component_count"], item["assessed_count"], item["edge_count"], item["reviewed_edges"]], "blockers": item["blockers"]}
        if outcome == "INDETERMINATE": item["state"] = "REVIEW"; item["indeterminate_until"] = now() + INDETERMINATE_REFUND_SECONDS
        else: item["state"] = "REVIEW"; item["challenge_until"] = now() + CHALLENGE_SECONDS
        self._save(release_id, item); return canonical(item["certificate"])

    @gl.public.write
    def finalize(self, release_id: u256) -> str:
        item = self._load(release_id); self._require(item, "REVIEW")
        if item["certificate"]["outcome"] == "INDETERMINATE": raise gl.vm.UserError("indeterminate_not_settleable")
        if now() < item["challenge_until"]: raise gl.vm.UserError("challenge_window_open")
        if item["certificate"]["outcome"] == "ACCEPTED": self._credit(item["implementer"], item["escrow"]); item["state"] = "ACCEPTED"
        else:
            for account, amount in item["sponsors"].items(): self._credit(account, amount)
            item["state"] = "REJECTED"
        self._save(release_id, item); return item["state"]

    @gl.public.write
    def refund_indeterminate(self, release_id: u256) -> str:
        item = self._load(release_id); self._require(item, "REVIEW")
        if item["certificate"]["outcome"] != "INDETERMINATE": raise gl.vm.UserError("not_indeterminate")
        if now() < item["indeterminate_until"]: raise gl.vm.UserError("indeterminate_review_open")
        for account, amount in item["sponsors"].items(): self._credit(account, amount)
        item["state"] = "REFUNDED"; self._save(release_id, item); return "REFUNDED"

    @gl.public.write
    def challenge_certificate(self, release_id: u256, entry_index: int, reason: str) -> str:
        item = self._load(release_id); self._require(item, "REVIEW")
        if item["certificate"]["outcome"] == "INDETERMINATE": raise gl.vm.UserError("indeterminate_certificate")
        if now() >= item["challenge_until"]: raise gl.vm.UserError("challenge_window_closed")
        challenger = wallet(gl.message.sender_address)
        if item["certificate"]["outcome"] == "ACCEPTED" and challenger not in item["sponsors"]: raise gl.vm.UserError("sponsor_only")
        if item["certificate"]["outcome"] == "REJECTED" and challenger != item["implementer"]: raise gl.vm.UserError("implementer_only")
        if not 0 <= entry_index < item["inventory_count"] or not 1 <= len(reason.strip()) <= 600: raise gl.vm.UserError("invalid_challenge")
        entry_key = self._key(release_id, "entry", entry_index)
        if entry_key not in self.entries: raise gl.vm.UserError("invalid_entry")
        entry = json.loads(self.entries[entry_key] or "{}")
        item["challenge"] = {"by": challenger, "entry_index": entry_index, "path": entry.get("path", ""), "reason": reason.strip()}
        item["state"] = "CHALLENGED"; self._save(release_id, item); return canonical(item["challenge"])

    @gl.public.write
    def review_challenge(self, release_id: u256) -> str:
        item = self._load(release_id); self._require(item, "CHALLENGED")
        challenge = item["challenge"]; challenged_index = challenge["entry_index"]
        component = None
        for index in range(item["component_count"]):
            candidate = json.loads(self.components[self._key(release_id, "component", index)] or "{}")
            if challenged_index in candidate.get("entries", []): component = candidate; break
        context_entries = [] if not component else [json.loads(self.entries[self._key(release_id, "entry", index)] or "{}") for index in component.get("entries", [])]
        context_paths = {entry.get("path", "") for entry in context_entries}
        context_edges = []
        for index in range(item["edge_count"]):
            edge = json.loads(self.edges[self._key(release_id, "edge", index)] or "{}")
            if edge.get("from") in context_paths or edge.get("to") in context_paths: context_edges.append(edge)
        challenge_packet = {"obligations": item["obligations"], "certificate_outcome": item["certificate"]["outcome"],
                            "challenge": challenge, "component_sources": [{"path": entry.get("path", ""), "text": entry.get("text", "")} for entry in context_entries],
                            "dependency_edges": context_edges, "baseline_changes": (item.get("seal") or {}).get("changes", []),
                            "runtime": {"state": (item.get("seal") or {}).get("runtime_state", "ABSENT"), "checks": (item.get("seal") or {}).get("runtime_checks", [])}}
        if not component or not context_entries or len(canonical(challenge_packet)) > MAX_COMPONENT_SOURCE_CHARS:
            verdict = {"result": "UNCERTAIN", "statuses": [], "rationale": "challenge context unavailable or oversized"}
        else:
            prompt = "Reassess this sealed release certificate challenge with its complete deterministic component, dependency, baseline-change, and runtime-check context. Reply JSON with result ACCEPT|REJECT|UNCERTAIN and exactly one status per obligation using only MET|NOT_MET|UNCERTAIN. ACCEPT is valid only when every status is MET. Evidence: " + canonical(challenge_packet)
            verdict = obligation_verdict(result_from_model(prompt), len(item["obligations"]))
        result = verdict["result"]
        all_obligations_met = len(verdict["statuses"]) == len(item["obligations"]) and all(status == "MET" for status in verdict["statuses"])
        # A challenge can invalidate an acceptance, but cannot manufacture a
        # global acceptance from a prior rejection.
        if item["certificate"]["outcome"] == "ACCEPTED" and result == "ACCEPT" and all_obligations_met: item["certificate"]["outcome"] = "ACCEPTED"
        elif item["certificate"]["outcome"] == "ACCEPTED" and result == "REJECT": item["certificate"]["outcome"] = "REJECTED"
        elif item["certificate"]["outcome"] == "REJECTED" and result == "REJECT": item["certificate"]["outcome"] = "REJECTED"
        else: item["certificate"]["outcome"] = "INDETERMINATE"
        item["certificate"]["challenge"] = {"path": challenge["path"], "result": result, "statuses": verdict["statuses"], "context_root": digest(challenge_packet)}
        item["state"] = "REVIEW"; item["challenge_until"] = now()
        if item["certificate"]["outcome"] == "INDETERMINATE": item["indeterminate_until"] = now() + INDETERMINATE_REFUND_SECONDS
        self._save(release_id, item)
        return canonical(item["certificate"])

    @gl.public.write
    def expire_unsealed(self, release_id: u256) -> str:
        item = self._load(release_id)
        if item["state"] != "DRAFT" or now() < item["seal_by"]: raise gl.vm.UserError("not_expirable")
        for account, amount in item["sponsors"].items(): self._credit(account, amount)
        item["state"] = "EXPIRED"; self._save(release_id, item); return "EXPIRED"

    @gl.public.write
    def withdraw(self) -> str:
        account = wallet(gl.message.sender_address); amount = int(self.balances[account]) if account in self.balances else 0
        if amount == 0: return "nothing_to_withdraw"
        self.balances[account] = u256(0); _Recipient(Address(account)).emit_transfer(value=u256(amount)); return str(amount)

    @gl.public.write
    def withdraw_funding(self) -> str:
        account = wallet(gl.message.sender_address)
        amount = int(self.funding_balances[account]) if account in self.funding_balances else 0
        if amount == 0: return "nothing_to_withdraw"
        self.funding_balances[account] = u256(0); _Recipient(Address(account)).emit_transfer(value=u256(amount)); return str(amount)

    @gl.public.view
    def get_release(self, release_id: u256) -> str:
        if release_id not in self.releases: return ""
        return self.releases[release_id] or ""
    @gl.public.view
    def get_entry(self, release_id: u256, index: int) -> str:
        key = self._key(release_id, "entry", index)
        if key not in self.entries: return ""
        return self.entries[key] or ""
    @gl.public.view
    def get_edge(self, release_id: u256, index: int) -> str:
        key = self._key(release_id, "edge", index)
        if key not in self.edges: return ""
        return self.edges[key] or ""
    @gl.public.view
    def get_component(self, release_id: u256, index: int) -> str:
        key = self._key(release_id, "component", index)
        if key not in self.components: return ""
        return self.components[key] or ""
    @gl.public.view
    def get_balance(self, account: str) -> u256:
        key = account.lower()
        return self.balances[key] if key in self.balances else u256(0)
    @gl.public.view
    def get_funding_balance(self, account: str) -> u256:
        key = account.lower()
        return self.funding_balances[key] if key in self.funding_balances else u256(0)
    @gl.public.view
    def get_next_id(self) -> u256:
        return self.next_id
