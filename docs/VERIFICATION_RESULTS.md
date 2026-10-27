# Verification results

Reference: `reviewer-evidence-2026-10-26-v9`.

| Command | Result |
| --- | --- |
| `npm run check:protocol` | 38 protocol guards passed |
| `npm run contract:test` | 41 tests passed |
| `npm run contract:mutation` | 20 critical mutations rejected |
| `npm --prefix frontend run build` | Production build passed; four routes generated |
| `npm --prefix frontend run test` | 18 tests passed across 6 files |
| `genvm-lint contract/contracts/beacon.py` | 3 checks passed |
| `npm --prefix frontend audit --omit=dev` | 0 vulnerabilities |
| Steward deployed-source fetch | Source matched SHA-256 `4ae0e6a0fe1f55fc4ec72c0caf5901267a2f7b557ffec250e88f0d4c3bed8d46`; compile passed; bundled SDK validation reported its runner archive unavailable |
| `npm run evidence:frontend` | Four production routes returned 200; final address and lifecycle operations were present |
| `npm run evidence:live` | Deployment, funding, seal, evidence, semantic votes, certificate, settlement, withdrawal, and replay assertions passed |
| `npm run evidence:public` | Reviewer-critical files were retrievable from the exact public commit |

The Python launcher selects one available interpreter before execution and preserves its real exit code; a test failure cannot be hidden by a fallback interpreter.
