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
| Deployed source reference | `reviewer-evidence-2026-10-26-v4` |
| Deployed source commit | `afdf1de59fa5b3c04453315a2bbf5af19c7fb79e` |
| Deployed source SHA-256 | `abeb2fd173aaf01edb98c9046ecb708ed38b5177f87097efdd0e362b56d2a7a0` |

The source digest covers the exact 33,707-byte `contract/contracts/beacon.py` payload returned by Studionet. The deployment started with `next_id = 1` and no preloaded release or balance data.

## Contract

1. Install the pinned tooling with `python3 -m venv .venv` and `.venv/bin/python -m pip install -r contract/requirements.txt`.
2. Run `npm run check` from the repository root.
3. Deploy `contract/contracts/beacon.py` using the repository-local GenLayer CLI against Studionet.
4. Record the deployed address only after its deployment transaction has reached finality and its source matches the reviewed Git blob.

## Frontend

1. Create `frontend/.env.local` for local development.
2. Add `NEXT_PUBLIC_BEACON_CONTRACT_ADDRESS=0x48629d95C2b1e51790d12b3E55108e5902727D4c`.
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

At the 26 October 2026 deployment audit, all local gates passed and npm reported zero production vulnerabilities. The latest workflow run for the reviewed implementation is [`40320191574`](https://github.com/zoefunds/beacon/actions/runs/40320191574). GitHub completed the workflow as failed without starting either job because the repository owner's account is locked for a billing issue. This is an external CI availability issue; it is not represented as a code failure or a passing CI result.

## Live lifecycle verification

Release `#1` on the active contract proves the financial expiry path. It opened with exactly 1 GEN, expired only after its recorded deadline, credited the fixed sponsor, transferred exactly 1 GEN to that EOA, and rejected a duplicate payout by returning no triggered transfer on a second withdrawal.

Release `#2` proves the complete certificate path on the same active deployment. It seals a commit before deadline, rejects a late substitution, inventories and materializes the full one-file fixture, builds its deterministic graph, obtains three agreeing validator votes for semantic assessment and certificate proposal, then routes the rejected certificate's escrow to the sponsor. A repeated finalization rolls back and a repeated withdrawal emits no transfer. Exact hashes, stored roots, balances, and executable assertions are in `docs/REVIEWER_EVIDENCE.md`, `docs/REVIEW_RESPONSE.md`, and `npm run evidence:live`.
