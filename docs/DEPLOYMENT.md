# Deployment

Beacon is deployed as one GenLayer Intelligent Contract and a static browser frontend.

## Active production record

| Item | Value |
| --- | --- |
| Frontend | `https://bea-con.vercel.app/` |
| Network | GenLayer Studionet (`61999`) |
| RPC | `https://studio.genlayer.com/api` |
| Explorer | `https://explorer-studio.genlayer.com` |
| Contract | `0x9D9AeA8B2B3586AC4B5e36a1B7f646689C3dfa44` |
| Deployment transaction | `0xb2a9fb59c2ba02dd11f58e577aa189d0e617688a46293bf94b35494a0e9d376a` |
| Deployed source commit | `43c5472` |
| Deployed source SHA-256 | `c433900a59e726b7a02eb34d6350e5109eba3bbbc3e0068eab736524e3123631` |

The source digest covers the exact 33,552-byte `contract/contracts/beacon.py` payload returned by Studionet. The deployment starts with `next_id = 1` and no preloaded release or balance data.

## Contract

1. Install the pinned tooling with `python3 -m venv .venv` and `.venv/bin/python -m pip install -r contract/requirements.txt`.
2. Run `npm run check` from the repository root.
3. Deploy `contract/contracts/beacon.py` using the repository-local GenLayer CLI against Studionet.
4. Record the deployed address only after its deployment transaction has reached finality and its source matches the reviewed Git blob.

## Frontend

1. Copy `.env.example` to `.env.local` inside `frontend/`.
2. Set `NEXT_PUBLIC_BEACON_CONTRACT_ADDRESS` to `0x9D9AeA8B2B3586AC4B5e36a1B7f646689C3dfa44`.
3. Run `npm --prefix frontend run build`.

The browser talks directly to the GenLayer RPC and the user’s EIP-1193 wallet. It contains no server wallet, API route, database, or background worker.

The deployed route map is:

- `/` — live release mission control
- `/launch` — contract-ready release creation form and test-data autofill
- `/attestations?release=<id>` — full seal, evidence, graph, challenge, transaction, and certificate record
- `/vault` — connected-wallet credit lookup and withdrawal

## Verification gates

Run `npm run check` from the repository root. The current suite contains 25 protocol guards, 28 contract tests, 8 mutation controls, and 15 frontend tests, followed by a production build. Also run:

```sh
genvm-lint contract/contracts/beacon.py
npm --prefix frontend audit --omit=dev
```

At the 26 October 2026 deployment audit, all local gates passed and npm reported zero production vulnerabilities. GitHub Actions is configured in `.github/workflows/`, but GitHub-hosted jobs are currently prevented from starting by an account billing lock. This is an external CI availability issue; it does not replace the required local gates.

## Live lifecycle verification

Release `#1` on the active contract exercised opening, sealing, complete tree discovery, materialization, graph construction, semantic assessment, and certificate proposal against `octocat/Spoon-Knife@d0dd1f61b33d64e29d8bc1372a94ef6a2fee76a9`. Its evidence coverage is `[1, 1, 1, 1, 0, 0]`, with no blockers. The semantic result was `INDETERMINATE`, so its 1 GEN sponsor escrow follows the designed seven-day refund path and becomes refundable after 2 November 2026 at 12:00:59 WAT. This time-stamped verification record is not seeded application data.
