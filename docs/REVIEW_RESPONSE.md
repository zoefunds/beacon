# Independent verification guide

> Reproduction instructions verified 27 October 2026.

Beacon's deployed implementation and evidence are reproducible from tag `reviewer-evidence-2026-10-27-v10`, commit `05231dd9a989c8b7c1fa52fd9ec7203f9a0cb3e8`. Later documentation-only commits do not alter that deployed source.

## Verify locally

```sh
git clone https://github.com/zoefunds/beacon.git
cd beacon
git checkout reviewer-evidence-2026-10-27-v10
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

- The deployed Studionet source at `0xeE34e10CF770aaDbfA9C369Eec946eb5c3D164E9` matches the reviewed 36,764-byte source digest.
- Agreement creation carries no value; the only payable method records funding without validation; allocation is a later value-free call.
- The release was funded with exactly 1 GEN and sealed before deadline to the stored commit and tree.
- The inventory is reconstructed from that seal, every scoped blob is byte-verified, and graph/assessment coverage is complete.
- Semantic judgment is produced by GenLayer nondeterministic execution and accepted only when validators agree on both result and ordered status vector.
- The certificate contains six valid commitment roots, complete coverage, and no blockers.
- Premature finalization fails, post-window finalization credits only the fixed beneficiary, duplicate finalization fails, withdrawal triggers one credited 1 GEN transfer, and the second withdrawal triggers none.
- Production routes return HTTP 200 and embed the same contract address and lifecycle operations.

## Fail-closed paths

Incomplete evidence cannot become success. Unsupported content, truncated trees, missing or altered blobs, local dependency ambiguity, unresolved dependencies, any configured budget exhaustion, incomplete component/edge assessment, missing obligation statuses, malformed model output, and validator disagreement produce a blocker, rollback, or `INDETERMINATE`. Indeterminate certificates cannot settle and become sponsor-refundable after seven days.

For exact transactions, certificate roots, source links, and expected test counts, see [`../REVIEWER_SUBMISSION.md`](../REVIEWER_SUBMISSION.md) and [`REVIEWER_EVIDENCE.md`](REVIEWER_EVIDENCE.md).
