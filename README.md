# Beacon

> Documentation verified 27 October 2026 against implementation tag `reviewer-evidence-2026-10-27-v12`, the active Studionet deployment, and the production frontend.

Beacon is a GenLayer release-attestation and conditional GEN escrow protocol. A release is sealed to an immutable Git commit before its deadline; after the deadline, the contract reconstructs the complete scoped inventory, verifies Git blob bytes, builds a bounded dependency graph, obtains validator-consensus semantic judgments, and issues a root-committed settlement certificate.

Reviewer entry point: [`REVIEWER_SUBMISSION.md`](REVIEWER_SUBMISSION.md).

## Security model

- Agreement creation is value-free. GEN first enters a non-reverting funding balance, then a separate validated `sponsor` call allocates it. Unallocated deposits remain withdrawable.
- `seal_release` verifies commit, tree, baseline ancestry, observed branch head, scoped baseline-to-release changes, and public commit-check evidence before the deadline. Post-close work uses only this stored seal.
- Inventory, blob verification, dependency extraction, graph construction, and coverage accounting are deterministic and bounded.
- Missing blobs, truncated trees, unsupported content, unresolved or ambiguous dependencies, cap exhaustion, incomplete coverage, or malformed semantic output fail closed.
- `gl.nondet.exec_prompt` runs inside `gl.vm.run_nondet`; validators compare both the result and complete ordered obligation-status vector. An obligation-bearing `ACCEPT` is valid only when every status is `MET`.
- A successful settlement also requires sealed public runtime evidence. Missing, pending, or failed checks resolve to non-settleable `INDETERMINATE` rather than payout.
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
- Contract: `0x3244f824cD071D564071AD5ad8207953a0A04Efb`
- Deployment transaction: `0xf5863c8d931f250430261570129a51ebb4f11c8251502b4c862ef4bc8497008c`
- Deployed source: 43,247 bytes, SHA-256 `406376022834a27cc6b53a13ea7168de0d2709bd94288eff3d9a01c159b85d35`
- Review tag: `reviewer-evidence-2026-10-27-v12`
- Reviewed commit: `7d2c0b6b7d1a2c8ec20458e331c46c633d3ae77d`
- Immutable frontend: `https://bea-oq7tlnoeg-adebiyi2002gmailcoms-projects.vercel.app`
- Vercel deployment: `dpl_63hpRvuraJ8oPWmwCvHsk7g1ipsL`

The frontend talks directly to GenLayer and contains no custodial backend. The active hardened deployment has no represented historical release record; the prior release-1 trace belongs to a superseded contract and is labeled as such in the evidence. The review tag and reviewed commit identify the deployed implementation; later documentation-only commits do not change its source digest.

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

Current results: 48 protocol guards, 54 contract tests, 28 mutation controls, a successful production build, 20 frontend tests across 6 files, 3 GenVM lint checks, and 0 known production dependency vulnerabilities. See [`docs/VERIFICATION_RESULTS.md`](docs/VERIFICATION_RESULTS.md), [`docs/REVIEWER_EVIDENCE.md`](docs/REVIEWER_EVIDENCE.md), and [`docs/VERDICT_INVARIANT.md`](docs/VERDICT_INVARIANT.md).

GitHub Actions receives branch and tag pushes, but the repository owner's billing lock currently prevents jobs from starting. This is reported as an external CI availability limitation, not as a passing run.
