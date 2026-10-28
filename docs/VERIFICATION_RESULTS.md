# Verification results

> Results last reproduced 28 October 2026.

Reference: `reviewer-evidence-2026-10-27-v13`.

| Command | Result |
| --- | --- |
| `npm run check:protocol` | 53 protocol guards passed |
| `npm run contract:test` | 59 tests passed |
| `npm run contract:mutation` | 32 critical mutations rejected |
| `npm --prefix frontend run build` | Production build passed; four routes generated |
| `npm --prefix frontend run test` | 20 tests passed across 6 files |
| `genvm-lint contract/contracts/beacon.py` | 3 checks passed |
| `npm --prefix frontend audit --omit=dev` | 0 vulnerabilities |
| `npm run evidence:live` | Studionet deployment finalized by majority agreement; fetched 45,544-byte source matched SHA-256 `d0f8c3b612836503f3558421a9b84a94e76afd6219dbeeea696927c45b0718e2` |
| `npm run evidence:frontend` | Four production routes returned 200; final address and lifecycle operations were present |
| Active transaction traces | Active release 1 and 2 prove challenged `UNCERTAIN` outcomes become non-settleable `INDETERMINATE`; active release 3 records funding, complete runtime-sealed evidence, semantic acceptance, challenge-window finalization, and withdrawal |
| `npm run evidence:public` | Reviewer-critical files were retrievable from the exact public commit |

The Python launcher selects one available interpreter before execution and preserves its real exit code; a test failure cannot be hidden by a fallback interpreter.
