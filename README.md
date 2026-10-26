# Beacon

**A release-attestation protocol for consequential repository changes on GenLayer.**

Reviewer starting point: [`REVIEWER_SUBMISSION.md`](REVIEWER_SUBMISSION.md). It contains the immutable reference, direct public source links, expected test results, and the complete Studionet transaction trace.

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
- Independent verification guide: [`docs/REVIEW_RESPONSE.md`](docs/REVIEW_RESPONSE.md)
- Recorded verification results: [`docs/VERIFICATION_RESULTS.md`](docs/VERIFICATION_RESULTS.md)
- Network: GenLayer Studionet, chain ID `61999`
- Contract: `0x48629d95C2b1e51790d12b3E55108e5902727D4c`
- Deployment transaction: `0xce6f6c496d144c1fdd6f8134ab45d4cff7081913b0c78e04881058565ecfa8d0`
- Reviewed implementation: tag `reviewer-evidence-2026-10-26-v8` (the tag resolves the exact immutable commit without self-referential documentation)

The frontend reads this contract directly and asks the connected wallet to add or switch to Studionet when necessary. There is no custodial backend.

## Local validation

```sh
npm ci
npm --prefix frontend ci
python3 -m venv .venv
.venv/bin/python -m pip install -r contract/requirements.txt
npm run check
```

The browser console exposes every contract transition, waits for Studionet consensus before reporting success, renders the complete seal/certificate/inventory/component/edge record, and supports pull-payment withdrawals.

The repository is public. Reviewers can inspect the [Intelligent Contract](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-26-v8/contract/contracts/beacon.py), [direct contract tests](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-26-v8/contract/tests/direct/test_lifecycle.py), [frontend integration](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-26-v8/frontend/lib/beacon-client.ts), and [live verifier](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-26-v8/scripts/verify-studionet.mjs) at the immutable review tag. `npm run evidence:public` checks these public raw files at the exact checked-out commit.

The current verification baseline is 28 protocol guards, 33 contract tests, 10 mutation controls, and 15 frontend tests. `npm run check` also performs a production Next.js build. GenVM lint passes independently, and the production dependency audit reports no known vulnerabilities. The reviewer evidence includes finalized live transactions for both the unsealed-expiry path and a complete certificate path: pre-deadline seal, blocked late substitution, canonical inventory, byte materialization, graph construction, native semantic consensus, certificate finalization, withdrawal, and replay prevention.

[GitHub Actions](https://github.com/zoefunds/beacon/actions) receives each branch and review-tag push, but the repository owner's account billing lock currently causes both jobs to fail with zero executed steps. This is documented as an external CI availability limitation, not as a passing test run or an implementation failure.
