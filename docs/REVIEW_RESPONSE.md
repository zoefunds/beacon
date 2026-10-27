# Independent verification guide

> Reproduction instructions verified 27 October 2026.

Beacon's active deployed implementation and evidence are reproducible from tag `reviewer-evidence-2026-10-27-v12`, commit `7d2c0b6b7d1a2c8ec20458e331c46c633d3ae77d`. Later documentation-only commits do not alter that deployed source.

## Verify locally

```sh
git clone https://github.com/zoefunds/beacon.git
cd beacon
git checkout reviewer-evidence-2026-10-27-v12
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

- The deployed Studionet source at `0x3244f824cD071D564071AD5ad8207953a0A04Efb` matches the reviewed 43,247-byte source digest: `406376022834a27cc6b53a13ea7168de0d2709bd94288eff3d9a01c159b85d35`.
- Agreement creation carries no value; the only payable method records funding without validation; allocation is a later value-free call.
- The seal commits the pre-deadline commit, tree, baseline tree, observed ref head, bounded baseline-to-release change manifest, and bounded public check records.
- The inventory is reconstructed from that seal, every scoped blob is byte-verified, and graph/assessment coverage is complete before a certificate can be considered.
- Semantic judgment is produced by GenLayer nondeterministic execution; validators must agree on both the result and ordered status vector, and `ACCEPT` is valid only when every obligation is `MET`.
- The certificate contains six valid commitment roots, complete coverage, no blockers, and successful sealed runtime evidence. Missing, pending, or failed checks yield non-settleable `INDETERMINATE`.
- Direct tests cover unauthorized and duplicate financial actions, expiry/refund paths, malformed and contradictory status vectors, and the seven-day indeterminate refund path. The older on-chain lifecycle trace is marked historical because it predates the active runtime-evidence requirement.
- Production routes return HTTP 200 and embed the same contract address and lifecycle operations.

## Fail-closed paths

Incomplete evidence cannot become success. Unsupported content, truncated trees, missing or altered blobs, local dependency ambiguity, unresolved dependencies, any configured budget exhaustion, incomplete component/edge assessment, missing obligation statuses, malformed model output, contradictory `ACCEPT` status vectors, validator disagreement, and absent/pending/failed runtime checks produce a blocker, rollback, or `INDETERMINATE`. Challenge review rebuilds the challenged component plus its incident dependency edges, then reassesses it with sealed baseline and runtime evidence. Indeterminate certificates cannot settle and become sponsor-refundable after seven days.

For exact transactions, certificate roots, source links, and expected test counts, see [`../REVIEWER_SUBMISSION.md`](../REVIEWER_SUBMISSION.md) and [`REVIEWER_EVIDENCE.md`](REVIEWER_EVIDENCE.md).
