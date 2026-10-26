# Deployment

Beacon is deployed as one GenLayer Intelligent Contract and a static browser frontend.

## Active production record

| Item | Value |
| --- | --- |
| Frontend | `https://bea-con.vercel.app/` |
| Vercel deployment | `dpl_CnCy9Wbyus4StJBV2YTDyn3KU4Ei` |
| Frontend Git tree | `1669a4e47d5bb6beb661de3fd97a2a4a9d08050c` |
| Network | GenLayer Studionet (`61999`) |
| RPC | `https://studio.genlayer.com/api` |
| Explorer | `https://explorer-studio.genlayer.com` |
| Contract | `0x48629d95C2b1e51790d12b3E55108e5902727D4c` |
| Deployment transaction | `0xce6f6c496d144c1fdd6f8134ab45d4cff7081913b0c78e04881058565ecfa8d0` |
| Deployed source reference | `reviewer-evidence-2026-10-26-v3` |
| Deployed source SHA-256 | `abeb2fd173aaf01edb98c9046ecb708ed38b5177f87097efdd0e362b56d2a7a0` |

The source digest covers the exact 33,707-byte `contract/contracts/beacon.py` payload returned by Studionet. The deployment started with `next_id = 1` and no preloaded release or balance data.

## Contract

1. Install the pinned tooling with `python3 -m venv .venv` and `.venv/bin/python -m pip install -r contract/requirements.txt`.
2. Run `npm run check` from the repository root.
3. Deploy `contract/contracts/beacon.py` using the repository-local GenLayer CLI against Studionet.
4. Record the deployed address only after its deployment transaction has reached finality and its source matches the reviewed Git blob.

## Frontend

1. Copy `.env.example` to `.env.local` inside `frontend/`.
2. Set `NEXT_PUBLIC_BEACON_CONTRACT_ADDRESS` to `0x48629d95C2b1e51790d12b3E55108e5902727D4c`.
3. Run `npm --prefix frontend run build`.

The browser talks directly to the GenLayer RPC and the user’s EIP-1193 wallet. It contains no server wallet, API route, database, or background worker.

The deployed route map is:

- `/` — live release mission control
- `/launch` — contract-ready release creation form and test-data autofill
- `/attestations?release=<id>` — full seal, evidence, graph, challenge, transaction, and certificate record
- `/vault` — connected-wallet credit lookup and withdrawal

## Verification gates

Run `npm run check` from the repository root. The current suite contains 28 protocol guards, 30 contract tests, 10 mutation controls, and 15 frontend tests, followed by a production build. Also run:

```sh
genvm-lint contract/contracts/beacon.py
npm --prefix frontend audit --omit=dev
```

At the 26 October 2026 deployment audit, all local gates passed and npm reported zero production vulnerabilities. GitHub Actions is configured in `.github/workflows/`, but GitHub-hosted jobs are currently prevented from starting by an account billing lock. This is an external CI availability issue; it does not replace the required local gates.

## Live lifecycle verification

Release `#1` on the active contract proves the financial expiry path. It opened with exactly 1 GEN, expired only after its recorded deadline, credited the fixed sponsor, transferred exactly 1 GEN to that EOA, and rejected a duplicate payout by returning no triggered transfer on a second withdrawal. Every consensus-bearing transaction finalized with majority agreement; the direct EOA transfer finalized with `value_credited: true`. Exact hashes and an executable verifier are in `docs/REVIEWER_EVIDENCE.md` and `npm run evidence:live`.
