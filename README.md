# Beacon

> Documentation verified 28 October 2026 against implementation tag `reviewer-evidence-2026-10-27-v13`, the active Studionet deployment, and the production frontend.

Beacon is a GenLayer release-attestation and conditional GEN escrow protocol. A release is sealed to an immutable Git commit before its deadline; after the deadline, the contract reconstructs the complete scoped inventory, verifies Git blob bytes, builds a bounded dependency graph, obtains validator-consensus semantic judgments, and issues a root-committed settlement certificate.

Reviewer entry point: [`REVIEWER_SUBMISSION.md`](REVIEWER_SUBMISSION.md).

## Security model

- Agreement creation is value-free. GEN first enters a non-reverting funding balance, then a separate validated `sponsor` call allocates it. Unallocated deposits remain withdrawable.
- `seal_release` verifies commit, tree, baseline ancestry, observed branch head, scoped baseline-to-release changes, the complete bounded GitHub check-run response, and the sponsor-approved check name/app policy before the deadline. Post-close work uses only this stored seal.
- Inventory, blob verification, dependency extraction, graph construction, and coverage accounting are deterministic and bounded.
- Missing blobs, truncated trees, unsupported content, unresolved or ambiguous dependencies, cap exhaustion, incomplete coverage, or malformed semantic output fail closed.
- `gl.nondet.exec_prompt` runs inside `gl.vm.run_nondet`; validators compare both the result and complete ordered obligation-status vector. An obligation-bearing `ACCEPT` is valid only when every status is `MET`.
- A successful settlement also requires sealed public runtime evidence. Pagination mismatch, omitted or unapproved checks, commit mismatch, and missing, pending, or failed checks prevent sealing and therefore cannot reach payout.
- Certificates commit agreement, seal, inventory, assessment, edge, and obligation roots. `INDETERMINATE` cannot settle and becomes sponsor-refundable after seven days.
- Settlement uses fixed beneficiaries, terminal states, pull payments, checks-effects-interactions, and replay-safe withdrawals.

## Lifecycle

`DRAFT → SEALED → INVENTORY → MATERIALIZED → ATTESTING → REVIEW → ACCEPTED | REJECTED | REFUNDED`

Unsealed releases can expire to sponsor credit. A certificate can be challenged during its 20-minute window. The browser reports success only after finality, majority agreement, and successful leader execution.

## Deployment

- Frontend: [bea-con.vercel.app](https://bea-con.vercel.app/)
- Attestation log: [open a release record](https://bea-con.vercel.app/attestations)
- Vault: [bea-con.vercel.app/vault](https://bea-con.vercel.app/vault)
- Network: GenLayer Studionet (`61999`)
- Contract: `0x37c8de10d3cC7ba4353608441A57a917e9628618`
- Deployment transaction: `0x26abab424352d9b30938aa7d9dd06a5d0cb0f713c48f9460ba2903527d11e0ab`
- Deployed source: 45,544 bytes, SHA-256 `d0f8c3b612836503f3558421a9b84a94e76afd6219dbeeea696927c45b0718e2`
- Review tag: `reviewer-evidence-2026-10-27-v13`
- Reviewed implementation commit: `dda9adbde0d7d797943fd030d85dbae36a2a47c9`
- Immutable frontend: `https://bea-3ymhr18yh-adebiyi2002gmailcoms-projects.vercel.app`
- Vercel deployment: `dpl_AV3Ayae1L21oUudRXEYmBqqN5fQf`

The frontend talks directly to GenLayer and contains no custodial backend. The active deployment includes current full-lifecycle evidence plus two challenged releases that demonstrate `UNCERTAIN` challenge output cannot preserve acceptance or release escrow. The immutable review tag resolves to the reviewed implementation commit above; later documentation-only commits do not alter its source digest.

## Reproduce

```sh
npm ci
npm --prefix frontend ci
python3 -m venv .venv
.venv/bin/python -m pip install -r contract/requirements.txt
npm run check
genvm-lint contract/contracts/beacon.py
npm --prefix frontend audit --omit=dev
npm run evidence
npm run evidence:live
npm run evidence:frontend
npm run evidence:public
```

Current results: 53 protocol guards, 59 contract tests, 32 mutation controls, a successful production build, 20 frontend tests across 6 files, 3 GenVM lint checks, and 0 known production dependency vulnerabilities. See [`docs/VERIFICATION_RESULTS.md`](docs/VERIFICATION_RESULTS.md), [`docs/REVIEWER_EVIDENCE.md`](docs/REVIEWER_EVIDENCE.md), and [`docs/VERDICT_INVARIANT.md`](docs/VERDICT_INVARIANT.md).

GitHub Actions receives branch and tag pushes, but the repository owner's billing lock currently prevents jobs from starting. This is reported as an external CI availability limitation, not as a passing run.
