# Verdict invariant

The payout-critical invariant is implemented at three independent layers.

1. `result_from_model` rejects a non-empty `ACCEPT` vector containing `NOT_MET` or `UNCERTAIN`.
2. `obligation_verdict` converts any contradictory or incomplete obligation-bearing result to `UNCERTAIN` before component assessment or challenge settlement logic consumes it.
3. `propose` independently requires every component to have `ACCEPT` and every obligation vector entry to equal `MET`; it also requires sealed successful public runtime evidence.

Challenge review reconstructs the challenged entry's complete deterministic component, incident dependency edges, sealed baseline-change manifest, and sealed runtime evidence. It may preserve `ACCEPTED` only if the reassessment is `ACCEPT` and all its statuses are `MET`.

Focused direct tests cover both `ACCEPT + NOT_MET` and `ACCEPT + UNCERTAIN` during component assessment, forged certificate aggregation, and challenge review. All cases produce `INDETERMINATE`, never an accepted certificate.

The active hardened contract is [`0x3244f824cD071D564071AD5ad8207953a0A04Efb`](https://explorer-studio.genlayer.com/tx/0xf5863c8d931f250430261570129a51ebb4f11c8251502b4c862ef4bc8497008c). Its source matches [the reviewed contract](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-27-v12/contract/contracts/beacon.py) byte-for-byte.
