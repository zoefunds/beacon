# Verification results

> Results last reproduced 27 October 2026.

Reference: `reviewer-evidence-2026-10-27-v12` (`7d2c0b6b7d1a2c8ec20458e331c46c633d3ae77d`).

| Command | Result |
| --- | --- |
| `npm run check:protocol` | 48 protocol guards passed |
| `npm run contract:test` | 54 tests passed |
| `npm run contract:mutation` | 28 critical mutations rejected |
| `npm --prefix frontend run build` | Production build passed; four routes generated |
| `npm --prefix frontend run test` | 20 tests passed across 6 files |
| `genvm-lint contract/contracts/beacon.py` | 3 checks passed |
| `npm --prefix frontend audit --omit=dev` | 0 vulnerabilities |
| `npm run evidence:live` | New hardened Studionet deployment finalized by majority agreement; fetched 43,247-byte source matched SHA-256 `406376022834a27cc6b53a13ea7168de0d2709bd94288eff3d9a01c159b85d35` |
| `npm run evidence:frontend` | Four production routes returned 200; final address and lifecycle operations were present |
| Historical transaction trace | Funding, seal, evidence, semantic vote, certificate, settlement, withdrawal, and replay transactions are documented for the superseded contract only; they are not claimed for the active hardened deployment |
| `npm run evidence:public` | Reviewer-critical files were retrievable from the exact public commit |

The Python launcher selects one available interpreter before execution and preserves its real exit code; a test failure cannot be hidden by a fallback interpreter.
