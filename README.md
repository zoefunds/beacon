# Beacon

Beacon is a GenLayer release-attestation and conditional GEN escrow protocol. A release is sealed to an immutable Git commit before its deadline; after the deadline, the contract reconstructs the complete scoped inventory, verifies Git blob bytes, builds a bounded dependency graph, obtains validator-consensus semantic judgments, and issues a root-committed settlement certificate.

Reviewer entry point: [`REVIEWER_SUBMISSION.md`](REVIEWER_SUBMISSION.md).

## Security model

- Agreement creation is value-free. GEN first enters a non-reverting funding balance, then a separate validated `sponsor` call allocates it. Unallocated deposits remain withdrawable.
- `seal_release` verifies commit, tree, baseline ancestry, and observed branch head before the deadline. Post-close work uses only this stored seal.
- Inventory, blob verification, dependency extraction, graph construction, and coverage accounting are deterministic and bounded.
- Missing blobs, truncated trees, unsupported content, unresolved or ambiguous dependencies, cap exhaustion, incomplete coverage, or malformed semantic output fail closed.
- `gl.nondet.exec_prompt` runs inside `gl.vm.run_nondet`; validators compare both the result and complete ordered obligation-status vector.
- Certificates commit agreement, seal, inventory, assessment, edge, and obligation roots. `INDETERMINATE` cannot settle and becomes sponsor-refundable after seven days.
- Settlement uses fixed beneficiaries, terminal states, pull payments, checks-effects-interactions, and replay-safe withdrawals.

## Lifecycle

`DRAFT → SEALED → INVENTORY → MATERIALIZED → ATTESTING → REVIEW → ACCEPTED | REJECTED | REFUNDED`

Unsealed releases can expire to sponsor credit. A certificate can be challenged during its 20-minute window. The browser reports success only after finality, majority agreement, and successful leader execution.

## Deployment

- Frontend: [bea-con.vercel.app](https://bea-con.vercel.app/)
- Attestation log: [release 1](https://bea-con.vercel.app/attestations?release=1)
- Vault: [bea-con.vercel.app/vault](https://bea-con.vercel.app/vault)
- Network: GenLayer Studionet (`61999`)
- Contract: `0xeE34e10CF770aaDbfA9C369Eec946eb5c3D164E9`
- Deployment transaction: `0x4038cc6af9f83d30a7ac3daab2202a9da564bcb147046fb4405c5135ec41b4c8`
- Deployed source: 36,764 bytes, SHA-256 `4ae0e6a0fe1f55fc4ec72c0caf5901267a2f7b557ffec250e88f0d4c3bed8d46`
- Review tag: `reviewer-evidence-2026-10-26-v9`
- Vercel deployment: `dpl_CYJESrkxDLdxNNYo1E57WZP9gXjG`

The frontend talks directly to GenLayer and contains no custodial backend.

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

Current results: 38 protocol guards, 41 contract tests, 20 mutation controls, a successful production build, 18 frontend tests across 6 files, 3 GenVM lint checks, and 0 known production dependency vulnerabilities. See [`docs/VERIFICATION_RESULTS.md`](docs/VERIFICATION_RESULTS.md) and [`docs/REVIEWER_EVIDENCE.md`](docs/REVIEWER_EVIDENCE.md).

GitHub Actions receives branch and tag pushes, but the repository owner's billing lock currently prevents jobs from starting. This is reported as an external CI availability limitation, not as a passing run.
