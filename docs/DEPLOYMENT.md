# Deployment

> Deployment record verified 27 October 2026.

## Active production record

| Item | Value |
| --- | --- |
| Frontend | `https://bea-con.vercel.app/` |
| Immutable frontend URL | `https://bea-lnvcqqt1m-adebiyi2002gmailcoms-projects.vercel.app` |
| Vercel deployment | `dpl_CYJESrkxDLdxNNYo1E57WZP9gXjG` |
| Network | GenLayer Studionet (`61999`) |
| RPC | `https://studio.genlayer.com/api` |
| Contract | `0xeE34e10CF770aaDbfA9C369Eec946eb5c3D164E9` |
| Deployment transaction | `0x4038cc6af9f83d30a7ac3daab2202a9da564bcb147046fb4405c5135ec41b4c8` |
| Source SHA-256 | `4ae0e6a0fe1f55fc4ec72c0caf5901267a2f7b557ffec250e88f0d4c3bed8d46` |
| Source size | `36,764` bytes |
| Review reference | `reviewer-evidence-2026-10-26-v9` |
| Reviewed commit | `340ec008fc864feb817d5445c35c7cd06251574e` |

The steward source fetcher retrieved the deployed payload from Studionet, compiled it, and produced the same SHA-256 digest as `contract/contracts/beacon.py`. Its bundled SDK validation could not load the pinned runner archive; the direct repository `genvm-lint` run independently passed all 3 lint checks.

Set `NEXT_PUBLIC_BEACON_CONTRACT_ADDRESS=0xeE34e10CF770aaDbfA9C369Eec946eb5c3D164E9` for the frontend. The deployed routes are `/`, `/launch`, `/attestations?release=<id>`, and `/vault`. The browser communicates directly with GenLayer and contains no server wallet or database.

`npm run check` runs 38 protocol guards, 41 contract tests, 20 mutation controls, a production build, and 18 frontend tests. `genvm-lint contract/contracts/beacon.py` passes 3 checks and `npm --prefix frontend audit --omit=dev` reports 0 vulnerabilities.

Exact lifecycle transactions are recorded in `REVIEWER_EVIDENCE.md` and checked by `npm run evidence:live`. The review tag and commit identify the deployed implementation; documentation-only commits after that reference do not alter the deployed source.
