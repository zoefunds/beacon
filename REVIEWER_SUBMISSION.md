# Beacon reviewer submission

This is the root-level entry point for independent review. It supersedes earlier submission references.

## Canonical reference

- Public repository: https://github.com/zoefunds/beacon
- Immutable review tag: `reviewer-evidence-2026-10-26-v8`
- Resolve the exact commit: `git rev-parse reviewer-evidence-2026-10-26-v8^{}`
- Production frontend: https://bea-con.vercel.app/
- Active Studionet contract: `0x48629d95C2b1e51790d12b3E55108e5902727D4c`
- Deployment transaction: https://explorer-studio.genlayer.com/tx/0xce6f6c496d144c1fdd6f8134ab45d4cff7081913b0c78e04881058565ecfa8d0
- Contract source SHA-256: `abeb2fd173aaf01edb98c9046ecb708ed38b5177f87097efdd0e362b56d2a7a0`

`npm run evidence` prints the exact checked-out commit, frontend tree, contract address, deployment transaction, source byte count, and source digest. The tag is used in this file because a commit cannot contain its own SHA.

## Direct public implementation links

- [Intelligent Contract source](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-26-v8/contract/contracts/beacon.py)
- [Direct lifecycle and adversarial tests](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-26-v8/contract/tests/direct/test_lifecycle.py)
- [Protocol source guards](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-26-v8/contract/tests/test_source_guards.py)
- [Dependency resolver tests](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-26-v8/contract/tests/test_resolver.py)
- [Mutation controls](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-26-v8/contract/tests/mutation/run.py)
- [Frontend release monitor](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-26-v8/frontend/components/ReleaseMonitor.tsx)
- [Finality-aware frontend client](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-26-v8/frontend/lib/beacon-client.ts)
- [Frontend tests](https://github.com/zoefunds/beacon/tree/reviewer-evidence-2026-10-26-v8/frontend)
- [Studionet lifecycle verifier](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-26-v8/scripts/verify-studionet.mjs)
- [Recorded verification results](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-26-v8/docs/VERIFICATION_RESULTS.md)

Run `npm run evidence:public` to retrieve the reviewer-critical files from `raw.githubusercontent.com` at the exact checked-out commit. It fails if any file is inaccessible or empty.

## Core lifecycle and fail-closed controls

`seal_release` permits only the recorded implementer, only before `seal_by`, and verifies commit reachability, baseline ancestry, commit tree, baseline tree, and observed ref head under GenLayer equality consensus. `begin_inventory` can run only after the deadline and uses only the stored seal; it never resamples the branch.

`discover_inventory` recursively retrieves the sealed tree without caller-supplied paths. Truncated, malformed, missing-scope, unsupported, or over-cap inventories create blockers. `materialize` checks decoded length, the blob-size limit, and Git blob SHA-1. Graph construction deterministically extracts and resolves supported Python and JavaScript/TypeScript dependencies. Ambiguity, unresolved local imports, import caps, edge caps, component caps, non-text content, and component-source caps block acceptance. `propose` refuses incomplete component or edge coverage and can issue `ACCEPTED` only with exact coverage, zero blockers, and unanimous `ACCEPT` results across all required assessments.

The direct suite covers truncated inventories, mismatched blobs, ambiguous and unresolved dependencies, unsupported content, exhausted import budgets, incomplete component coverage, invalid certificates, authorization, premature finalization, duplicate finalization, rejection routing, expiry, empty and duplicate withdrawals, and exact seven-day indeterminate recovery.

## Native GenLayer reasoning and finality

Semantic classification is implemented by `result_from_model`, which calls `gl.nondet.exec_prompt` inside `gl.vm.run_nondet(leader, validator)`. Validators compare the bounded settlement category. Malformed, conflicting, or non-decisive results become `UNCERTAIN`; they cannot authorize acceptance. Deterministic code owns evidence identifiers, graph structure, coverage, certificate roots, and settlement accounting.

The browser client calls `waitForTransactionReceipt` with status `FINALIZED` and rejects consensus-bearing results other than `MAJORITY_AGREE` before presenting a successful write. Active release `#2` assessment and certificate transactions each record three agreeing validator votes.

## Financial evidence

Release `#1` proves unsealed expiry, sponsor refund, a credited 1 GEN EOA transfer, and a zero-transfer second withdrawal. Release `#2` proves the complete certificate path. Its rejected semantic outcome refunds the sponsor and never credits the implementer.

| Release #2 event | Studionet transaction |
| --- | --- |
| Fund agreement with exactly 1 GEN | [`0x1e6b…c3b8f`](https://explorer-studio.genlayer.com/tx/0x1e6b5314982df60b9c6c3a2021a9d74a0695a7ce2fac6c0d92fc1bbd0f3c3b8f) |
| Seal immutable commit before deadline | [`0xac65…625e3`](https://explorer-studio.genlayer.com/tx/0xac65cc9c8e2994bb39972875b1f79b4e243b783e365a06975d174cdb41a625e3) |
| Reject post-deadline substitution | [`0x8cc2…0c0ae`](https://explorer-studio.genlayer.com/tx/0x8cc278f31a1cf5dad4858c5c7485e6be87e0f0c07681dbce1342b3fa35b0c0ae) |
| Discover sealed inventory | [`0x2387…c518`](https://explorer-studio.genlayer.com/tx/0x23873975ab69e61d5e5d66688df67bc7b5575e7d0abec5b7ec43f40ef221c518) |
| Verify Git blob bytes | [`0x124a…50a6`](https://explorer-studio.genlayer.com/tx/0x124ad12772063d6aec70c17384ea3fd4b3b298d43c90a17f62887d64d8a150a6) |
| Build dependency graph | [`0xb8d7…e96`](https://explorer-studio.genlayer.com/tx/0xb8d7e02764054edb31b5577aa90dc71806bedec2347d5cffcc56fe19d23fae96) |
| Native semantic assessment | [`0x2f82…627b2`](https://explorer-studio.genlayer.com/tx/0x2f82fbb82394976a208c28f9cbc761292d365f7987a2ca49b8fbc352dd7627b2) |
| Generate certificate | [`0x8c13…95de`](https://explorer-studio.genlayer.com/tx/0x8c13f4d0919a1107c64324ad7e9bc561e74a637146f45f834ac649951eaf95de) |
| Finalize after challenge window | [`0xf603…1c17`](https://explorer-studio.genlayer.com/tx/0xf60399d05baef7c75c5cd544dffff0576d45683c20de2faee8cc74c749e61c17) |
| Reject duplicate finalization | [`0x7b29…b795`](https://explorer-studio.genlayer.com/tx/0x7b29cadfe3b0d7215db67db4f205dec5053494a61331f09c585513a9bab5b795) |
| Withdraw sponsor refund | [`0x431b…4190`](https://explorer-studio.genlayer.com/tx/0x431b31750e068e77740978dbb82c3d392862aad372f45782fd9d277a44634190) |
| Credit exactly 1 GEN to EOA | [`0xe15f…08aa`](https://explorer-studio.genlayer.com/tx/0xe15f2996e6def7199ab0bd5fc1fb83b20b6e85a7be30b298478f40f9ae8908aa) |
| Second withdrawal emits no transfer | [`0xaa1b…f3fb`](https://explorer-studio.genlayer.com/tx/0xaa1b25028cf9b2989113c5c9f01375fbc693a9d6c6859bcff81003ffef3cf3fb) |

The corresponding production state is available at https://bea-con.vercel.app/attestations?release=2 and the pull-payment interface at https://bea-con.vercel.app/vault.

## Reproduce

```sh
git clone https://github.com/zoefunds/beacon.git
cd beacon
git checkout reviewer-evidence-2026-10-26-v8
npm ci
npm --prefix frontend ci
python3 -m venv .venv
.venv/bin/python -m pip install -r contract/requirements.txt
npm run check
genvm-lint contract/contracts/beacon.py
npm --prefix frontend audit --omit=dev
npm run evidence
npm run evidence:public
npm run evidence:live
npm run evidence:frontend
```

Expected results: 28 protocol guards, 33 contract tests, 10 mutation controls, 15 frontend tests across 6 files, a successful production build, 3 GenVM lint checks, zero production dependency vulnerabilities, publicly retrievable exact-commit source, and passing active Studionet and production verifiers.

The Python test commands no longer use `command || fallback`. `scripts/run-python.mjs` selects an available interpreter before execution, runs the test once, and preserves its actual exit status.
