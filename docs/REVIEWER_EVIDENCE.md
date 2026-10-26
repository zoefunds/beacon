# Reviewer verification reference

This reference maps Beacon's security claims to source, automated tests, production bundles, and finalized Studionet transactions. It distinguishes the active deployment from historical consensus evidence and reports unsuccessful diagnostic transactions explicitly.

## Immutable reference

- Repository: `https://github.com/zoefunds/beacon`
- Review tag: `reviewer-evidence-2026-10-26-v3`
- Review commit: `afdf1de59fa5b3c04453315a2bbf5af19c7fb79e`
- Frontend Git tree: `1669a4e47d5bb6beb661de3fd97a2a4a9d08050c`
- Production frontend: `https://bea-con.vercel.app/`
- Vercel deployment: `dpl_CnCy9Wbyus4StJBV2YTDyn3KU4Ei`
- GenLayer network: Studionet, chain ID `61999`
- Active Intelligent Contract: `0x48629d95C2b1e51790d12b3E55108e5902727D4c`
- Deployment transaction: `0xce6f6c496d144c1fdd6f8134ab45d4cff7081913b0c78e04881058565ecfa8d0`
- Contract source SHA-256: `abeb2fd173aaf01edb98c9046ecb708ed38b5177f87097efdd0e362b56d2a7a0`
- Contract source size: 33,707 bytes

The deployment transaction is `FINALIZED / MAJORITY_AGREE`. Studionet returns a source payload byte-for-byte equal to `contract/contracts/beacon.py`. Run `npm run evidence` at the review tag to print the exact commit, frontend tree, source digest, deployment identifiers, commands, and transaction references. The tag avoids embedding a commit's own SHA inside itself.

## Reproduce

```sh
git clone https://github.com/zoefunds/beacon.git
cd beacon
git checkout reviewer-evidence-2026-10-26-v3
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
```

At this reference, `npm run check` passes 28 protocol guards, 30 direct contract tests, 10 mutation controls, a production build, and 15 frontend tests. GenVM lint passes and the production dependency audit reports zero vulnerabilities. `evidence:live` independently fetches every cited active transaction, asserts finality and majority agreement where consensus applies, verifies exact 1 GEN escrow and EOA transfer, checks final balances, proves the second withdrawal emitted no transfer, and verifies historical validator consensus for semantic assessment. `evidence:frontend` fetches all four production routes and their JavaScript bundles.

## Implementation map

| Guarantee | Implementation |
| --- | --- |
| Pre-deadline seal | `seal_release` checks authorization, deadline, commit/ref reachability, baseline ancestry, and the complete four-field seal. |
| Complete scope | `discover_inventory` recursively fetches the sealed tree, rejects truncation and malformed entries, records every scope root, and is one-shot. |
| Byte identity | `materialize` checks decoded size, byte limit, and Git blob object SHA-1. |
| Dependency closure | Bounded deterministic extraction covers Python and JS/TS static, relative, side-effect, dynamic, and CommonJS imports. Local-looking unresolved references become blockers. |
| Deterministic evidence IDs | Inventory, edges, and union-find components are contract-derived; the model cannot emit evidence identifiers. |
| Consensus assessment | `result_from_model` runs `gl.nondet.exec_prompt` inside `gl.vm.run_nondet`; validators compare the settlement category and malformed/inconsistent output fails to `UNCERTAIN`. |
| Complete certificate | `propose` requires exact entry/component/edge coverage and zero blockers before acceptance, then commits agreement and evidence roots. |
| Financial safety | Fixed-beneficiary pull payments, membership-safe credits, checks-effects-interactions, an EOA transfer interface, terminal state transitions, and zero-credit withdrawal handling prevent premature or duplicate payout. |
| Runtime boundaries | `open_release` normalizes GenLayer's runtime `Address` value before validation; source and mutation guards preserve the boundary. |
| UI finality | Every write waits for `FINALIZED`; the monitor renders live seal, counters, blockers, inventory, components, edges, challenge, certificate, balance, and latest transaction. |

## Adversarial scenarios

| Scenario | Reproducible evidence |
| --- | --- |
| Incomplete/truncated inventory | `test_truncated_inventory_fails_closed`; truncation mutation control |
| Unresolved dependency | `test_unresolved_dependency_and_inconsistent_assessment_cannot_accept`; resolver unit cases |
| Inconsistent semantic result | same lifecycle test; `test_semantic_result_is_decided_by_validator_consensus` |
| Incomplete/invalid certificate | `test_incomplete_coverage_and_invalid_certificate_cannot_settle`; coverage source guard |
| Expired deadline | `test_expiry_refund_credits_a_new_sponsor_balance`; active Studionet expiry below |
| Unauthorized settlement | `test_only_implementer_can_seal_and_challenge_roles_are_reciprocal` |
| Premature/duplicate payout | `test_finalize_cannot_pay_early_or_twice`; finalized zero-credit withdrawal below |
| Refund/withdrawal correctness | refund and checks-effects tests; active 1 GEN transfer below |
| Runtime `Address` argument | `test_open_release_normalizes_genlayer_address_arguments`; source and mutation guards |
| Frontend finality and states | client finality test; pending/finalized component tests; parameterized rejected/challenged/finalized monitor tests |

## Active 1 GEN expiry, refund, and withdrawal trace

Release `#1` on the active contract uses `octocat/Spoon-Knife`, baseline `d0dd1f61b33d64e29d8bc1372a94ef6a2fee76a9`, and scope `index.html`.

| Event | Finalized transaction |
| --- | --- |
| Deploy exact audited source | `0xce6f6c496d144c1fdd6f8134ab45d4cff7081913b0c78e04881058565ecfa8d0` |
| Open and escrow exactly 1 GEN | `0x35316f278f9afe08dc1ac761c36af4cc0440c517329d4a9f49fa62642f13e5a7` |
| Expire after Unix deadline `1793016000` | `0xb6fc86601e4fa1ea931e0acb270994d9c4ece7d7324a60ffc90c84b1d5e92330` |
| Withdraw credited refund | `0x53de362f8923ff6eb437798f03603b9644d693fc9c1c9bee3122cdc019153024` |
| Triggered EOA transfer of exactly 1 GEN | `0xca18a8edef2b44b93368b0ad6f6b7fefc3b6b86d78669b7a5ff2438e0fddf31d` |
| Second withdrawal, no transfer | `0x5080326c39e89f87bb9b7c20d3b65786a78abb5022d3a2ce479dcb61133c7674` |

The opening, expiry, withdrawal, and second withdrawal are each `FINALIZED / MAJORITY_AGREE`. The direct EOA transfer is `FINALIZED`, carries exactly `1000000000000000000` wei, and reports `value_credited: true`; direct value transfers do not run validator rounds. Final state is `EXPIRED`, contract credit is `0`, and the wallet balance is exactly `1000000000000000000` wei. The second withdrawal has no triggered transactions, proving live double-withdrawal prevention.

## Validator consensus evidence

The prior finalized semantic trace remains useful evidence of actual nondeterministic execution. Component assessment `0xbdda39c7df2b341e5d7adb6ef8ad5a5a2f3efcb2b2a28ea79f631d6b71635396` and certificate proposal `0xe20e354c3ae1de6fc1c6c7c9b70dedd16b2133dca2398c3b37505ac3e3edbc8e` each record three agreeing validator addresses. `npm run evidence:live` re-fetches and checks these votes. They are identified as historical consensus evidence, not as transactions on the active deployment.

## Diagnostic history

Unsuccessful calls are not presented as successful evidence. On superseded deployments, withdrawal `0x2a075e905319a3c21b86cef77b04fc602ebf6621c1edc6a36f12655a26fc52d7` exposed the incorrect IC-to-IC transfer primitive, while funded calls `0x6ba14d285e7bc0933e3641b9c48b3754ce7479a6b9db0364205f1ebb336a9b04` and `0x4c63cdcd1fdcaf3d3c96172a908e03b0d2d0696cecb2063d94c31fe92bb82d6a` exposed CLI baseline encoding and runtime `Address` normalization respectively. On the active deployment, `0xcb7803e625aa268f6f44c096f20e74598e8efc4ab8ab9156679f5c928e110a7c` rolled back before release creation because the temporary CLI encoded JSON strings as arrays. The active release trace above uses corrected encoding and is the successful, independently reproducible financial proof.

## External CI limitation

GitHub Actions contains the same checks. The latest reviewed run, [`40320191574`](https://github.com/zoefunds/beacon/actions/runs/40320191574), completed without starting either job because the repository owner's account is locked by a billing issue. This is reported as an external CI availability limitation, not as a passing run or an implementation failure. All local and live verification commands above remain reproducible.
