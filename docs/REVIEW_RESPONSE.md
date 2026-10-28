# Independent verification guide

> Reproduction instructions verified 28 October 2026.

Beacon's active deployed implementation and evidence are reproducible from tag `reviewer-evidence-2026-10-27-v13`.

## Verify locally

```sh
git clone https://github.com/zoefunds/beacon.git
cd beacon
git checkout reviewer-evidence-2026-10-27-v13
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

## What the verifier establishes

- The deployed Studionet source at `0x37c8de10d3cC7ba4353608441A57a917e9628618` matches the reviewed 45,544-byte source digest: `d0f8c3b612836503f3558421a9b84a94e76afd6219dbeeea696927c45b0718e2`.
- Agreement creation carries no value; the only payable method records funding without validation; allocation is a later value-free call.
- The seal commits the pre-deadline commit, tree, baseline tree, observed ref head, bounded baseline-to-release change manifest, complete bounded check-run response, and sponsor-approved check-name/app policy.
- The inventory is reconstructed from that seal, every scoped blob is byte-verified, and graph/assessment coverage is complete before a certificate can be considered.
- Semantic judgment is produced by GenLayer nondeterministic execution; validators must agree on both the result and ordered status vector, and `ACCEPT` is valid only when every obligation is `MET`.
- The certificate contains six valid commitment roots, complete coverage, no blockers, and successful sealed runtime evidence. Pagination mismatch, a missing required check, a check for another commit/app, or any pending/failed returned check prevents sealing.
- Direct tests cover unauthorized and duplicate financial actions, expiry/refund paths, malformed and contradictory status vectors, exact runtime-check completeness/policy, and the seven-day indeterminate refund path. Active on-chain traces cover both fail-closed challenge outcomes and successful settlement.
- Production routes return HTTP 200 and embed the same contract address and lifecycle operations.

## Fail-closed paths

Incomplete evidence cannot become success. Unsupported content, truncated trees, missing or altered blobs, local dependency ambiguity, unresolved dependencies, any configured budget exhaustion, incomplete component/edge assessment, missing obligation statuses, malformed model output, contradictory `ACCEPT` status vectors, validator disagreement, and absent/pending/failed runtime checks produce a blocker, rollback, or `INDETERMINATE`. Challenge review rebuilds the challenged component plus its incident dependency edges, then reassesses it with sealed baseline and runtime evidence. Indeterminate certificates cannot settle and become sponsor-refundable after seven days.

For exact transactions, certificate roots, source links, and expected test counts, see [`../REVIEWER_SUBMISSION.md`](../REVIEWER_SUBMISSION.md) and [`REVIEWER_EVIDENCE.md`](REVIEWER_EVIDENCE.md).
