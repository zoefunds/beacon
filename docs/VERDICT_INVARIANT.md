# Verdict invariant

The payout-critical invariant is implemented at three independent layers.

1. `result_from_model` rejects a non-empty `ACCEPT` vector containing `NOT_MET` or `UNCERTAIN`.
2. `obligation_verdict` converts any contradictory or incomplete obligation-bearing result to `UNCERTAIN` before component assessment or challenge settlement logic consumes it.
3. `propose` independently requires every component to have `ACCEPT` and every obligation vector entry to equal `MET`; it also requires sealed successful public runtime evidence.

Challenge review reconstructs the challenged entry's complete deterministic component, incident dependency edges, sealed baseline-change manifest, and sealed runtime evidence. It may preserve `ACCEPTED` only if the reassessment is `ACCEPT` and all its statuses are `MET`.

Focused direct tests cover both `ACCEPT + NOT_MET` and `ACCEPT + UNCERTAIN` during component assessment, forged certificate aggregation, and challenge review. All cases produce `INDETERMINATE`, never an accepted certificate.

The active hardened contract is [`0x37c8de10d3cC7ba4353608441A57a917e9628618`](https://explorer-studio.genlayer.com/tx/0x26abab424352d9b30938aa7d9dd06a5d0cb0f713c48f9460ba2903527d11e0ab). Its source matches [the reviewed contract](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-27-v13/contract/contracts/beacon.py) byte-for-byte.
