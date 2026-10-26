# Independent verification guide

This guide answers the implementation, consensus, financial-safety, and deployment questions with executable references. The canonical machine-readable record is produced by `npm run evidence`; the live assertions are executed by `npm run evidence:live`.

## Reproducible release

| Artifact | Reference |
| --- | --- |
| Repository | `https://github.com/zoefunds/beacon` |
| Immutable review tag | `reviewer-evidence-2026-10-26-v7` |
| Production frontend | `https://bea-con.vercel.app/` |
| Vercel deployment | `dpl_CnCy9Wbyus4StJBV2YTDyn3KU4Ei` |
| Studionet contract | `0x48629d95C2b1e51790d12b3E55108e5902727D4c` |
| Deployment transaction | `0xce6f6c496d144c1fdd6f8134ab45d4cff7081913b0c78e04881058565ecfa8d0` |
| Deployed source digest | `abeb2fd173aaf01edb98c9046ecb708ed38b5177f87097efdd0e362b56d2a7a0` |

Direct public source links:

- [Intelligent Contract](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-26-v7/contract/contracts/beacon.py)
- [Direct lifecycle and adversarial tests](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-26-v7/contract/tests/direct/test_lifecycle.py)
- [Protocol source guards](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-26-v7/contract/tests/test_source_guards.py)
- [Mutation controls](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-26-v7/contract/tests/mutation/run.py)
- [Frontend release monitor](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-26-v7/frontend/components/ReleaseMonitor.tsx)
- [Finality-aware frontend client](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-26-v7/frontend/lib/beacon-client.ts)
- [Executable Studionet verifier](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-26-v7/scripts/verify-studionet.mjs)

The deployed contract record identifies the 33,707-byte `contract/contracts/beacon.py` payload by SHA-256 digest. `npm run evidence` independently hashes the checked-out source and prints that digest together with the exact Git commit and deployment identifiers. `npm run evidence:live` then verifies the cited deployment and lifecycle transactions against Studionet.

## Seal and repository completeness

Release `#2` sealed commit `d0dd1f61b33d64e29d8bc1372a94ef6a2fee76a9` and tree `d7cee29eaada459ba458a63ad983a89915c6a10a` before deadline `1793017900`. Transaction `0xac65cc9c8e2994bb39972875b1f79b4e243b783e365a06975d174cdb41a625e3` is the finalized seal. A later attempt to substitute another commit, transaction `0x8cc278f31a1cf5dad4858c5c7485e6be87e0f0c07681dbce1342b3fa35b0c0ae`, rolled back. The executable verifier asserts both the failed execution and that the original stored seal is unchanged.

Inventory is derived recursively from the sealed Git tree, not supplied by the caller or model. Release `#2` proves the bounded sequence `begin_inventory → discover_inventory → close_inventory → materialize → build_review_graph`. The final certificate commits separate roots for agreement, seal, inventory, graph edges, obligations, and assessments. Blob materialization recalculates Git's object hash; malformed, missing, oversized, binary, submodule, ambiguous, unresolved, truncated, or budget-exhausted evidence creates a blocker or aborts the transition. `propose` cannot issue `ACCEPTED` unless all coverage counters are exact and `blockers` is empty.

## Native reasoning and consensus

Deterministic code discovers the inventory, verifies Git objects, extracts supported imports, resolves dependencies, builds graph components, and checks certificate coverage. Only then does `result_from_model` invoke `gl.nondet.exec_prompt` within `gl.vm.run_nondet`. Validators compare a bounded settlement category; malformed or inconsistent output maps to `UNCERTAIN`, never acceptance.

On the active contract, assessment transaction `0x2f82fbb82394976a208c28f9cbc761292d365f7987a2ca49b8fbc352dd7627b2` and certificate transaction `0x8c13f4d0919a1107c64324ad7e9bc561e74a637146f45f834ac649951eaf95de` each finalized with three agreeing validator votes. The resulting certificate is `REJECTED` despite complete deterministic coverage `[1, 1, 1, 1, 0, 0]`. This live result demonstrates that semantic consensus participates in the outcome and that mechanical completeness alone cannot authorize payment.

## Escrow correctness

Release `#1` proves the unsealed-expiry path: exactly 1 GEN entered escrow, expiry credited the fixed sponsor, withdrawal emitted one credited 1 GEN EOA transfer, and a repeated withdrawal emitted no transfer.

Release `#2` proves the certificate path. Exactly 1 GEN was deposited in the opening transaction. The rejected certificate can credit only the recorded sponsors after its challenge window; it cannot pay the implementer. Finalization is terminal, so a duplicate finalization rolls back. Withdrawal zeroes credit before transfer, and a repeated withdrawal cannot emit another transfer. Exact settlement hashes and final balances are listed in `REVIEWER_EVIDENCE.md` and asserted live by `scripts/verify-studionet.mjs`.

## Adversarial test matrix

| Requirement | Direct or mutation evidence |
| --- | --- |
| Incomplete inventory | `test_truncated_inventory_fails_closed`; tree-truncation mutation |
| Missing blob or altered bytes | `test_incomplete_coverage_and_invalid_certificate_cannot_settle`; blob-hash mutation |
| Unresolved dependency | `test_unresolved_dependency_and_inconsistent_assessment_cannot_accept`; resolver tests |
| Unsupported content or exhausted bounds | protocol guards plus positive-certificate blocker gate |
| Inconsistent assessment | `test_unresolved_dependency_and_inconsistent_assessment_cannot_accept` |
| Invalid certificate or incomplete coverage | `test_incomplete_coverage_and_invalid_certificate_cannot_settle` |
| Expired deadline | `test_expiry_refund_credits_a_new_sponsor_balance`; live release `#1` |
| Unauthorized seal/challenge | `test_only_implementer_can_seal_and_challenge_roles_are_reciprocal` |
| Premature or duplicate settlement | `test_finalize_cannot_pay_early_or_twice`; live release `#2` |
| Rejected payout routing | `test_rejection_refunds_sponsor_and_withdraw_uses_checks_effects` |
| Double withdrawal | same direct test; live releases `#1` and `#2` |
| Seven-day indeterminate recovery | `test_indeterminate_release_becomes_refundable` rejects the call one second early and succeeds at the exact deadline |
| Missing or mismatched blob | `test_missing_or_mismatched_blob_fails_closed` records `blob_verification_failed` |
| Unsupported content | `test_unsupported_content_cannot_accept` produces an `INDETERMINATE` certificate with an explicit blocker |
| Exhausted import budget | `test_exhausted_import_budget_cannot_accept` records `import_cap:src/a.ts` |

## Frontend state correspondence

The production [attestation view for release #2](https://bea-con.vercel.app/attestations?release=2) reads the active contract and renders its `REJECTED` terminal state, immutable seal, coverage, blockers, inventory, components, dependency edges, challenge record, certificate roots, and finalized transaction hash. The [vault](https://bea-con.vercel.app/vault) reads connected-wallet contract credit and disables withdrawal when the balance is zero. `writeBeacon` waits specifically for `FINALIZED` and rejects any consensus-bearing receipt whose result is not `MAJORITY_AGREE` before either page displays a successful write.

## One-command verification

```sh
git clone https://github.com/zoefunds/beacon.git
cd beacon
git checkout reviewer-evidence-2026-10-26-v7
npm ci
npm --prefix frontend ci
python3 -m venv .venv
.venv/bin/python -m pip install -r contract/requirements.txt
npm run check
genvm-lint contract/contracts/beacon.py
npm --prefix frontend audit --omit=dev
npm run evidence
npm run evidence:live
npm run evidence:frontend
npm run evidence:public
```

The local suite is authoritative and reproducible without privileged credentials. The live verifier is read-only. It fails on a non-finalized transaction, missing validator agreement, altered seal, incorrect certificate roots or coverage, incorrect escrow routing, a non-credited transfer, or any repeated transfer.
