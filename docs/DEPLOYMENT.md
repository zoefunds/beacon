# Deployment

Beacon is deployed as one GenLayer Intelligent Contract and a static browser frontend.

## Contract

1. Install the pinned tooling with `python3 -m venv .venv` and `.venv/bin/python -m pip install -r contract/requirements.txt`.
2. Run `npm run check` from the repository root.
3. Deploy `contract/contracts/beacon.py` using the repository-local GenLayer CLI against Studionet.
4. Record the deployed address only after its deployment transaction has reached finality and its source matches the reviewed Git blob.

## Frontend

1. Copy `.env.example` to `.env.local` inside `frontend/`.
2. Set `NEXT_PUBLIC_BEACON_CONTRACT_ADDRESS` to `0x934F8BEa6F8Cfa3e149A762930D6c1702c012336`.
3. Run `npm --prefix frontend run build`.

The browser talks directly to the GenLayer RPC and the user’s EIP-1193 wallet. It contains no server wallet, API route, database, or background worker.

## Production

The production frontend is served at `https://bea-con.vercel.app/`. The contract deployment transaction is `0xfbd5c6830c092a98b955e6716d61ba6c7a64de4be0ff6b422643aafd287e5f6e` and the final source SHA-256 is `ec5a00042d2ab3a0270bd927fc49a04927fe2af87847e5a77f9b4585ec480410`.
