# Deployment

> Deployment record verified 27 October 2026.

## Active production record

| Item | Value |
| --- | --- |
| Frontend | `https://bea-con.vercel.app/` |
| Immutable frontend URL | `https://bea-oq7tlnoeg-adebiyi2002gmailcoms-projects.vercel.app` |
| Vercel deployment | `dpl_63hpRvuraJ8oPWmwCvHsk7g1ipsL` |
| Network | GenLayer Studionet (`61999`) |
| RPC | `https://studio.genlayer.com/api` |
| Contract | `0x3244f824cD071D564071AD5ad8207953a0A04Efb` |
| Deployment transaction | `0xf5863c8d931f250430261570129a51ebb4f11c8251502b4c862ef4bc8497008c` |
| Source SHA-256 | `406376022834a27cc6b53a13ea7168de0d2709bd94288eff3d9a01c159b85d35` |
| Source size | `43,247` bytes |
| Review reference | `reviewer-evidence-2026-10-27-v12` |
| Reviewed commit | `7d2c0b6b7d1a2c8ec20458e331c46c633d3ae77d` |

`npm run evidence:live` retrieves the active code with `gen_getContractCode` and matches the full payload byte-for-byte against `contract/contracts/beacon.py`. The deployment finalized with a majority consensus result and successful leader execution. The direct repository `genvm-lint` run independently passes all 3 lint checks.

Set `NEXT_PUBLIC_BEACON_CONTRACT_ADDRESS=0x3244f824cD071D564071AD5ad8207953a0A04Efb` for the frontend. The deployed routes are `/`, `/launch`, `/attestations?release=<id>`, and `/vault`. The browser communicates directly with GenLayer and contains no server wallet or database.

`npm run check` runs 48 protocol guards, 54 contract tests, 28 mutation controls, a production build, and 20 frontend tests. `genvm-lint contract/contracts/beacon.py` passes 3 checks and `npm --prefix frontend audit --omit=dev` reports 0 vulnerabilities.

The earlier complete lifecycle transaction trace is retained in `REVIEWER_EVIDENCE.md` as historical evidence for the superseded deployment; it is not presented as evidence of the active contract's stricter runtime-check rule. The review tag and commit identify the deployed implementation; documentation-only commits after that reference do not alter the deployed source.
