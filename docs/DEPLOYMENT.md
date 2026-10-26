# Deployment

Beacon is deployed as one GenLayer Intelligent Contract and a static browser frontend.

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

## Production

The production frontend is served at `https://bea-con.vercel.app/`. The active contract deployment transaction is `0xb2a9fb59c2ba02dd11f58e577aa189d0e617688a46293bf94b35494a0e9d376a`; its source is commit `43c5472`.
