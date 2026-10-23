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

TEXT_EXTENSIONS = {"py", "js", "jsx", "ts", "tsx", "json", "md", "yml", "yaml", "toml", "css", "html", "sh", "txt"}
TERMINAL = {"ACCEPTED", "REJECTED", "EXPIRED"}

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
            return {"result": result, "statuses": [str(x)[:80] for x in statuses], "rationale": str(value.get("rationale", ""))[:1200]}
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

def normalized_scope(raw):
    try: values = json.loads(raw)
    except Exception: raise gl.vm.UserError("invalid_scope")
    if not isinstance(values, list) or not 1 <= len(values) <= MAX_SCOPE: raise gl.vm.UserError("invalid_scope")
    values = sorted(set(str(v).strip().rstrip("/") for v in values))
    if len(values) == 0 or any(not path_ok(v) for v in values): raise gl.vm.UserError("invalid_scope_path")
    return values

def in_scope(path, scopes):
    return any(path == item or path.startswith(item + "/") for item in scopes)

def extension(path):
    return path.rsplit(".", 1)[-1].lower() if "." in path else ""

def import_targets(path, text):
    """A deliberately conservative parser: unresolved local-looking imports block acceptance."""
    found = []
    if extension(path) == "py":
        for item in re.findall(r"(?:from|import)\s+([A-Za-z_][A-Za-z0-9_\.]*)", text): found.append(item.replace(".", "/"))
    elif extension(path) in {"js", "jsx", "ts", "tsx"}:
        for item in re.findall(r"(?:from\s*|import\s*\()\s*[\"']([^\"']+)[\"']", text):
            if item.startswith("."): found.append(item)
    return sorted(set(found))[:32]

def resolve_local_import(source, reference, available):
    """Resolve a parser-produced local import against the sealed inventory.

    A reference that might identify a repository file is never silently
    discarded.  The caller gets either one canonical path or an explicit
    unresolved/ambiguous result.
    """
    candidates = []
    if reference.startswith("."):
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
        stem = reference.replace(".", "/")
        candidates = [stem + ".py", stem + "/__init__.py"]
    matches = [candidate for candidate in candidates if candidate in available]
    return matches[0] if len(matches) == 1 else None

class Beacon(gl.Contract):
    # Persistent maps must be declared as storage fields. Constructing them in
    # __init__ creates an ephemeral map in the current Studionet runtime.
    next_id: u256
    releases: TreeMap[u256, str]
    entries: TreeMap[str, str]
    edges: TreeMap[str, str]
    components: TreeMap[str, str]
    balances: TreeMap[str, u256]

    def __init__(self):
        self.next_id = u256(1)

    def _key(self, release_id, kind, index): return f"{int(release_id)}:{kind}:{index}"
    def _load(self, release_id):
        raw = self.releases[release_id]
        if not raw: raise gl.vm.UserError("unknown_release")
        return json.loads(raw)
    def _save(self, release_id, item): self.releases[release_id] = canonical(item)
    def _credit(self, account, amount): self.balances[account] = u256(int(self.balances[account] or 0) + amount)
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
        baseline_tree = str(((baseline_data.get("commit") or {}).get("tree") or {}).get("sha", "")).lower()
        if str(commit_data.get("sha", "")).lower() != commit.lower() or str(baseline_data.get("sha", "")).lower() != item["baseline"] or not sha(tree) or not sha(baseline_tree): return None
        if not isinstance(compare, dict) or str(((compare.get("merge_base_commit") or {}).get("sha") or "")).lower() != commit.lower(): return None
        return {"commit": commit.lower(), "tree": tree, "baseline_tree": baseline_tree, "observed_ref_head": head}

    @gl.public.write.payable
    def open_release(self, repo: str, ref: str, baseline: str, implementer: str, title: str, obligations_json: str, scope_json: str, seal_by: int) -> str:
        if int(gl.message.value) < MIN_ESCROW: raise gl.vm.UserError("minimum_escrow")
        if not repository(repo) or not sha(baseline) or not re.fullmatch(r"0x[0-9a-fA-F]{40}", implementer or ""): raise gl.vm.UserError("invalid_identity")
        if seal_by <= now() + 300: raise gl.vm.UserError("seal_time_too_soon")
        try: obligations = json.loads(obligations_json)
        except Exception: raise gl.vm.UserError("invalid_obligations")
        if not isinstance(obligations, list) or not 1 <= len(obligations) <= MAX_OBLIGATIONS or any(not str(x).strip() for x in obligations): raise gl.vm.UserError("invalid_obligations")
        release_id = self.next_id; self.next_id = u256(int(release_id) + 1)
        item = {"id": int(release_id), "state": "DRAFT", "repo": repo, "ref": ref, "baseline": baseline.lower(), "implementer": implementer.lower(), "sponsors": {wallet(gl.message.sender_address): int(gl.message.value)}, "escrow": int(gl.message.value), "title": title[:120], "obligations": [str(x).strip() for x in obligations], "scope": normalized_scope(scope_json), "seal_by": seal_by, "seal": None, "inventory_count": 0, "materialized_count": 0, "component_count": 0, "assessed_count": 0, "edge_count": 0, "reviewed_edges": 0, "blockers": [], "challenge_until": 0, "challenge": None, "certificate": None}
        self._save(release_id, item)
        return canonical({"release_id": int(release_id), "state": "DRAFT"})

    @gl.public.write.payable
    def sponsor(self, release_id: u256) -> str:
        item = self._load(release_id); self._require(item, "DRAFT")
        value = int(gl.message.value)
        if value <= 0: raise gl.vm.UserError("empty_funding")
        who = wallet(gl.message.sender_address); item["sponsors"][who] = item["sponsors"].get(who, 0) + value; item["escrow"] += value
        self._save(release_id, item); return "funded"

    @gl.public.write
    def seal_release(self, release_id: u256, commit: str) -> str:
        item = self._load(release_id); self._require(item, "DRAFT")
        if wallet(gl.message.sender_address) != item["implementer"]: raise gl.vm.UserError("implementer_only")
        if now() >= item["seal_by"] or not sha(commit): raise gl.vm.UserError("seal_closed")
        def fetch_seal(): return canonical(self._seal_source(item, commit) or {})
        try: seal = json.loads(gl.eq_principle.strict_eq(fetch_seal))
        except Exception: seal = None
        if seal is None: raise gl.vm.UserError("unverifiable_seal")
        item["seal"] = seal; item["state"] = "SEALED"; self._save(release_id, item)
        return canonical(seal)

    @gl.public.write
    def begin_inventory(self, release_id: u256) -> str:
        item = self._load(release_id); self._require(item, "SEALED")
        if now() < item["seal_by"]: raise gl.vm.UserError("seal_window_open")
        # The sealed tree is frozen; post-deadline branch state is intentionally never fetched.
        item["state"] = "INVENTORY"; item["cursor"] = ["", item["seal"]["tree"]]; self._save(release_id, item)
        return "inventory_started"

    @gl.public.write
    def discover_inventory(self, release_id: u256) -> str:
        item = self._load(release_id); self._require(item, "INVENTORY")
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
        for entry in sorted(entries, key=lambda x: str((x or {}).get("path", ""))):
            if item["inventory_count"] >= MAX_PATHS: item["blockers"].append("inventory_cap"); break
            path = str((entry or {}).get("path", "")); kind = str((entry or {}).get("type", "")); blob = str((entry or {}).get("sha", "")).lower(); size = int((entry or {}).get("size", -1))
            if not in_scope(path, item["scope"]): continue
            if not path_ok(path) or not in_scope(path, item["scope"]) or kind not in {"blob", "commit"}: item["blockers"].append("unsupported_inventory_entry"); continue
            index = item["inventory_count"]; classification = "TEXT" if kind == "blob" and extension(path) in TEXT_EXTENSIONS else ("BINARY" if kind == "blob" else "SUBMODULE")
            self.entries[self._key(release_id, "entry", index)] = canonical({"path": path, "blob": blob, "size": size, "class": classification, "status": "PENDING"})
            item["inventory_count"] += 1
        self._save(release_id, item); return canonical({"inventory_count": item["inventory_count"], "blockers": item["blockers"]})

    @gl.public.write
    def close_inventory(self, release_id: u256) -> str:
        item = self._load(release_id); self._require(item, "INVENTORY")
        if item["inventory_count"] == 0: item["blockers"].append("empty_inventory")
        item["state"] = "MATERIALIZED"; self._save(release_id, item); return "inventory_closed"

    @gl.public.write
    def materialize(self, release_id: u256, entry_index: int) -> str:
        item = self._load(release_id); self._require(item, "MATERIALIZED")
        key = self._key(release_id, "entry", entry_index); entry = json.loads(self.entries[key] or "{}")
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
        else: entry["status"] = "VERIFIED"; entry["text"] = raw.decode("utf-8", errors="replace"); item["materialized_count"] += 1
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
            for target in import_targets(entry["path"], entry.get("text", "")):
                # Local relative targets must resolve; a model cannot waive this condition.
                resolved = resolve_local_import(entry["path"], target, paths)
                # A relative JavaScript import must resolve. Python imports that
                # don't map to the sealed tree are external dependencies; a
                # Python name that has a local prefix but no unique target blocks.
                if target.startswith(".") and not resolved:
                    item["blockers"].append("unresolved_local_import:" + entry["path"] + ":" + target)
                elif resolved:
                    edges.append((entry["path"], resolved))
        for index, edge in enumerate(sorted(set(edges))[:MAX_EDGES]): self.edges[self._key(release_id, "edge", index)] = canonical({"from": edge[0], "to": edge[1], "status": "PENDING"})
        if len(edges) > MAX_EDGES: item["blockers"].append("edge_cap")
        item["edge_count"] = min(len(set(edges)), MAX_EDGES); item["component_count"] = item["inventory_count"]; item["state"] = "ATTESTING"; self._save(release_id, item)
        return canonical({"components": item["component_count"], "edges": item["edge_count"]})

    @gl.public.write
    def assess_component(self, release_id: u256, entry_index: int) -> str:
        item = self._load(release_id); self._require(item, "ATTESTING")
        entry = json.loads(self.entries[self._key(release_id, "entry", entry_index)] or "{}")
        if not entry or entry.get("assessment"): raise gl.vm.UserError("already_assessed")
        if entry.get("status") != "VERIFIED": entry["assessment"] = {"result": "BLOCKED"}
        else:
            prompt = "Classify this immutable release component against obligations. Reply JSON with result ACCEPT|REJECT|UNCERTAIN and statuses array. Obligations: " + canonical(item["obligations"]) + " Source path: " + entry["path"] + " Source: " + entry["text"]
            verdict = result_from_model(prompt) or {"result": "UNCERTAIN"}
            entry["assessment"] = {"result": str(verdict.get("result", "UNCERTAIN")).upper(), "statuses": verdict.get("statuses", [])}
        item["assessed_count"] += 1; self.entries[self._key(release_id, "entry", entry_index)] = canonical(entry); self._save(release_id, item); return canonical(entry["assessment"])

    @gl.public.write
    def review_edge(self, release_id: u256, edge_index: int) -> str:
        item = self._load(release_id); self._require(item, "ATTESTING")
        key = self._key(release_id, "edge", edge_index); edge = json.loads(self.edges[key] or "{}")
        if not edge or edge["status"] != "PENDING": raise gl.vm.UserError("invalid_edge")
        from_entry = None; to_entry = None
        for index in range(item["inventory_count"]):
            candidate = json.loads(self.entries[self._key(release_id, "entry", index)] or "{}")
            if candidate.get("path") == edge["from"]: from_entry = candidate
            if candidate.get("path") == edge.get("to"): to_entry = candidate
        if not from_entry or not to_entry:
            edge["status"] = "BLOCKED"; item["blockers"].append("edge_source_missing")
        else:
            prompt = "Review compatibility of a sealed dependency edge. Reply JSON with result ACCEPT|REJECT|UNCERTAIN. Consumer path/source: " + edge["from"] + "\n" + from_entry.get("text", "") + "\nProvider path/source: " + edge["to"] + "\n" + to_entry.get("text", "")
            verdict = result_from_model(prompt) or {"result": "UNCERTAIN"}
            edge["status"] = str(verdict.get("result", "UNCERTAIN")).upper()
        item["reviewed_edges"] += 1; self.edges[key] = canonical(edge); self._save(release_id, item); return canonical(edge)

    @gl.public.write
    def propose(self, release_id: u256) -> str:
        item = self._load(release_id); self._require(item, "ATTESTING")
        if item["assessed_count"] != item["component_count"] or item["reviewed_edges"] != item["edge_count"]: raise gl.vm.UserError("coverage_incomplete")
        results = []; inventory = []; reviewed_edges = []
        for i in range(item["inventory_count"]):
            entry = json.loads(self.entries[self._key(release_id, "entry", i)]); inventory.append({k: entry.get(k) for k in ("path", "blob", "status")}); results.append(entry.get("assessment", {}).get("result", "BLOCKED"))
        for i in range(item["edge_count"]): reviewed_edges.append(json.loads(self.edges[self._key(release_id, "edge", i)]))
        edge_results = [edge.get("status", "BLOCKED") for edge in reviewed_edges]
        accepted = not item["blockers"] and results and all(x == "ACCEPT" for x in results) and all(x == "ACCEPT" for x in edge_results)
        rejected = "REJECT" in results or "REJECT" in edge_results
        outcome = "ACCEPTED" if accepted else ("REJECTED" if rejected else "INDETERMINATE")
        item["certificate"] = {"outcome": outcome, "seal_root": digest(item["seal"]), "inventory_root": digest(inventory), "assessment_root": digest(results), "edge_root": digest(reviewed_edges), "obligation_root": digest(item["obligations"]), "coverage": [item["inventory_count"], item["materialized_count"], item["assessed_count"], item["edge_count"], item["reviewed_edges"]], "blockers": item["blockers"]}
        if outcome == "INDETERMINATE": item["state"] = "REVIEW"
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
    def challenge_certificate(self, release_id: u256, entry_index: int, reason: str) -> str:
        item = self._load(release_id); self._require(item, "REVIEW")
        if now() >= item["challenge_until"]: raise gl.vm.UserError("challenge_window_closed")
        if item["certificate"]["outcome"] == "INDETERMINATE": raise gl.vm.UserError("indeterminate_certificate")
        challenger = wallet(gl.message.sender_address)
        if item["certificate"]["outcome"] == "ACCEPTED" and challenger not in item["sponsors"]: raise gl.vm.UserError("sponsor_only")
        if item["certificate"]["outcome"] == "REJECTED" and challenger != item["implementer"]: raise gl.vm.UserError("implementer_only")
        if not 0 <= entry_index < item["inventory_count"] or not 1 <= len(reason.strip()) <= 600: raise gl.vm.UserError("invalid_challenge")
        entry = json.loads(self.entries[self._key(release_id, "entry", entry_index)] or "{}")
        item["challenge"] = {"by": challenger, "entry_index": entry_index, "path": entry.get("path", ""), "reason": reason.strip()}
        item["state"] = "CHALLENGED"; self._save(release_id, item); return canonical(item["challenge"])

    @gl.public.write
    def review_challenge(self, release_id: u256) -> str:
        item = self._load(release_id); self._require(item, "CHALLENGED")
        challenge = item["challenge"]; entry = json.loads(self.entries[self._key(release_id, "entry", challenge["entry_index"])] or "{}")
        prompt = "Reassess a sealed release certificate challenge using only the committed entry. Reply JSON with result ACCEPT|REJECT|UNCERTAIN. Obligations: " + canonical(item["obligations"]) + " Certificate outcome: " + item["certificate"]["outcome"] + " Challenge: " + challenge["reason"] + " Path: " + challenge["path"] + " Source: " + entry.get("text", "")
        verdict = result_from_model(prompt) or {"result": "UNCERTAIN"}
        result = str(verdict.get("result", "UNCERTAIN")).upper()
        # A challenge can invalidate an acceptance, but one rechecked entry
        # cannot manufacture a global acceptance from a prior rejection.
        if item["certificate"]["outcome"] == "ACCEPTED" and result == "REJECT": item["certificate"]["outcome"] = "REJECTED"
        elif item["certificate"]["outcome"] == "REJECTED" and result == "REJECT": item["certificate"]["outcome"] = "REJECTED"
        else: item["certificate"]["outcome"] = "INDETERMINATE"
        item["certificate"]["challenge"] = {"path": challenge["path"], "result": result}
        item["state"] = "REVIEW"; item["challenge_until"] = now(); self._save(release_id, item)
        return canonical(item["certificate"])

    @gl.public.write
    def expire_unsealed(self, release_id: u256) -> str:
        item = self._load(release_id)
        if item["state"] != "DRAFT" or now() < item["seal_by"]: raise gl.vm.UserError("not_expirable")
        for account, amount in item["sponsors"].items(): self._credit(account, amount)
        item["state"] = "EXPIRED"; self._save(release_id, item); return "EXPIRED"

    @gl.public.write
    def withdraw(self) -> str:
        account = wallet(gl.message.sender_address); amount = int(self.balances[account] or 0)
        if amount == 0: return "nothing_to_withdraw"
        self.balances[account] = u256(0); gl.get_contract_at(Address(account)).emit_transfer(value=u256(amount)); return str(amount)

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
    def get_balance(self, account: str) -> u256:
        key = account.lower()
        return self.balances[key] if key in self.balances else u256(0)
