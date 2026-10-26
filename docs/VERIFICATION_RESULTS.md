# Verification results

This record summarizes the reproducible verification run for `reviewer-evidence-2026-10-26-v8`. Commands are expected to exit nonzero on any failed assertion.

| Command | Verified result |
| --- | --- |
| `npm run check:protocol` | 28 non-negotiable protocol guards passed |
| `npm run contract:test` | 33 tests passed, including settlement, evidence, authorization, challenge, and seven-day recovery cases |
| `npm run contract:mutation` | 10 security-critical mutations rejected |
| `npm --prefix frontend run build` | Production build completed; `/`, `/launch`, `/attestations`, and `/vault` generated |
| `npm --prefix frontend run test` | 15 tests passed across 6 files |
| `genvm-lint contract/contracts/beacon.py` | 3 checks passed |
| `npm --prefix frontend audit --omit=dev` | 0 vulnerabilities |
| `npm run evidence:live` | Both active 1 GEN lifecycle traces, validator votes, roots, balances, transfers, and replay guards passed |
| `npm run evidence:frontend` | Four production routes returned HTTP 200 and deployed bundles exposed all lifecycle operations |
| `npm run evidence:public` | Contract, nested tests, frontend integration, and live verifier were publicly retrievable at the exact commit |

The Python launcher checks `.venv/bin/python`, then `python3`, then `python` only to locate an available interpreter. Once selected, it executes the requested test command exactly once and propagates its actual exit status. A genuine pytest or mutation-test failure is never reinterpreted as interpreter unavailability and never retried under another interpreter.
