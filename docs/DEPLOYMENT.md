# Deployment

> Deployment record verified 28 October 2026.

## Active production record

| Item | Value |
| --- | --- |
| Frontend | `https://bea-con.vercel.app/` |
| Immutable frontend URL | `https://bea-3ymhr18yh-adebiyi2002gmailcoms-projects.vercel.app` |
| Vercel deployment | `dpl_AV3Ayae1L21oUudRXEYmBqqN5fQf` |
| Network | GenLayer Studionet (`61999`) |
| RPC | `https://studio.genlayer.com/api` |
| Contract | `0x37c8de10d3cC7ba4353608441A57a917e9628618` |
| Deployment transaction | `0x26abab424352d9b30938aa7d9dd06a5d0cb0f713c48f9460ba2903527d11e0ab` |
| Source SHA-256 | `d0f8c3b612836503f3558421a9b84a94e76afd6219dbeeea696927c45b0718e2` |
| Source size | `45,544` bytes |
| Review reference | `reviewer-evidence-2026-10-27-v13` |
| Reviewed implementation commit | `dda9adbde0d7d797943fd030d85dbae36a2a47c9` |

`npm run evidence:live` retrieves the active code with `gen_getContractCode` and matches the full payload byte-for-byte against `contract/contracts/beacon.py`. The deployment finalized with a majority consensus result and successful leader execution. The direct repository `genvm-lint` run independently passes all 3 lint checks.

Set `NEXT_PUBLIC_BEACON_CONTRACT_ADDRESS=0x37c8de10d3cC7ba4353608441A57a917e9628618` for the frontend. The deployed routes are `/`, `/launch`, `/attestations?release=<id>`, and `/vault`. The browser communicates directly with GenLayer and contains no server wallet or database.

`npm run check` runs 53 protocol guards, 59 contract tests, 32 mutation controls, a production build, and 20 frontend tests. `genvm-lint contract/contracts/beacon.py` passes 3 checks and `npm --prefix frontend audit --omit=dev` reports 0 vulnerabilities.

The active deployment's release 3 trace covers agreement creation, 1 GEN funding, strict runtime sealing, inventory, byte verification, native semantic assessment, accepted certification, the full challenge window, finalization, withdrawal, and the triggered 1 GEN transfer. Active releases 1 and 2 separately demonstrate that uncertain challenge reviews become non-settleable `INDETERMINATE`.
