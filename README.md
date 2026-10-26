# Beacon

**A release-attestation protocol for consequential repository changes on GenLayer.**

Beacon holds GEN until a declared release is independently attested against a frozen repository baseline. Its central primitive is a **release seal**: the implementer selects a reachable commit *before* the deadline and validators bind that commit, its tree, and every in-scope path to the agreement. Nothing observed for the first time after the deadline can become the release under review.

## What makes an attestation complete

Beacon produces a settlement certificate only when all of these are true:

1. A pre-deadline release seal is verified and remains the only review target.
2. The complete scoped tree inventory is materialized, including unchanged files.
3. Every inventory entry has a byte-verified Git blob or a supported, explicitly classified non-text representation.
4. A deterministic dependency extractor records supported Python and JavaScript/TypeScript local import edges, including relative imports, side-effect imports, dynamic imports, and CommonJS `require` calls. Parser caps become explicit blockers.
5. Deterministic graph connectivity forms bounded components. Every component and every cross-component edge has an attestation result.
6. The certificate commits to the agreement, inventory, blob hashes, dependency graph, assessments, and coverage counters.

Unsupported content, tree truncation, ambiguous resolution, missing evidence, or budget exhaustion blocks positive settlement. The protocol can return `INDETERMINATE`, but it never upgrades partial coverage into success.

## Layout

```text
contract/       GenLayer Intelligent Contract and direct tests
frontend/       browser-only Next.js operations console
docs/           protocol, trust, and operational documentation
scripts/        reproducibility and architecture checks
```

## Lifecycle

`DRAFT → SEALED → INVENTORY → MATERIALIZED → ATTESTING → REVIEW → ACCEPTED | REJECTED | REFUNDED`

A certificate may also enter `CHALLENGED` before returning to review. Unsealed agreements expire to sponsor credit. An indeterminate certificate stays reviewable for seven days and then becomes sponsor-refundable, so escrow cannot remain locked forever.

The release seal belongs before the deadline. Post-deadline callers merely advance bounded, deterministic work over that seal.

## Live deployment

- Frontend: [bea-con.vercel.app](https://bea-con.vercel.app/)
- Attestation log: [bea-con.vercel.app/attestations](https://bea-con.vercel.app/attestations)
- Pull-payment vault: [bea-con.vercel.app/vault](https://bea-con.vercel.app/vault)
- Reviewer evidence: [`docs/REVIEWER_EVIDENCE.md`](docs/REVIEWER_EVIDENCE.md)
- Network: GenLayer Studionet, chain ID `61999`
- Contract: `0x9D9AeA8B2B3586AC4B5e36a1B7f646689C3dfa44`

The frontend reads this contract directly and asks the connected wallet to add or switch to Studionet when necessary. There is no custodial backend.

## Local validation

```sh
npm ci
npm --prefix frontend ci
python -m pip install -r contract/requirements.txt
npm run check
```

The browser console exposes every contract transition, waits for Studionet consensus before reporting success, renders the complete seal/certificate/inventory/component/edge record, and supports pull-payment withdrawals.

The current verification baseline is 25 protocol guards, 28 contract tests, 8 mutation controls, and 15 frontend tests. `npm run check` also performs a production Next.js build. GenVM lint passes independently, and the production dependency audit reports no known vulnerabilities.
