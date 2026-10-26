# Reviewer verification reference

This document maps Beacon's advertised guarantees to inspectable source, executable tests, and finalized Studionet transactions. It is intentionally evidence-oriented: an uncertain result is reported as uncertain, and local simulations are not described as live-chain withdrawals.

## Immutable reference

- Repository: `https://github.com/zoefunds/beacon`
- Review tag: `reviewer-evidence-2026-10-26-v2`
- Production frontend: `https://bea-con.vercel.app/`
- Production Vercel deployment: `dpl_6YEoehRyiKWbUuqxnP9PtUXyZ5TW`
- Deployed frontend Git tree: `1669a4e47d5bb6beb661de3fd97a2a4a9d08050c`
- GenLayer network: Studionet, chain ID `61999`
- Intelligent Contract: `0x9D9AeA8B2B3586AC4B5e36a1B7f646689C3dfa44`
- Deployment transaction: `0xb2a9fb59c2ba02dd11f58e577aa189d0e617688a46293bf94b35494a0e9d376a`
- Contract source SHA-256: `c433900a59e726b7a02eb34d6350e5109eba3bbbc3e0068eab736524e3123631`
- Contract source size: 33,552 bytes

Run `npm run evidence` at the review tag to print the exact commit SHA, Git frontend-tree identifier, source digest, deployment identifiers, verification commands, and live trace as JSON. The production deployment above was built from that exact frontend tree. The tag resolves the self-reference problem of embedding a commit's own SHA inside that commit.

## Reproduce locally

```sh
git clone https://github.com/zoefunds/beacon.git
cd beacon
git checkout reviewer-evidence-2026-10-26-v2
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

`npm run check` executes the protocol guard, direct contract suite, mutation controls, production frontend build, and frontend unit/component suite. `npm run evidence:live` independently fetches every cited transaction and the stored release from Studionet, checks that creation escrowed exactly 1 GEN, requires a validator majority for semantic assessment and certificate proposal, fails unless every transaction is `FINALIZED / MAJORITY_AGREE`, and prints the resulting evidence as JSON. `npm run evidence:frontend` fetches every production route and deployed JavaScript bundle and fails unless the active contract, finality handling, complete lifecycle operation surface, dedicated evidence/vault pages, and seven-day refund copy are present. The expected totals at this reference are recorded by command output rather than copied into an unverifiable screenshot.

## Implementation map

| Guarantee | Implementation |
| --- | --- |
| Pre-deadline seal | `Beacon.seal_release` checks caller, deadline, commit/ref reachability, baseline ancestry, and the four-field seal before storage. `begin_inventory` can only use that stored tree. |
| Complete scope | `discover_inventory` recursively fetches the sealed Git tree, rejects truncation/malformed trees, tracks every scope root, and is one-shot. |
| Byte identity | `materialize` base64-decodes each text blob, checks its declared size and limit, and recomputes Git's blob SHA-1 object identifier. |
| Dependency closure | `import_targets`, `resolve_local_import`, and `local_reference` deterministically extract and resolve supported Python and JS/TS imports. Unresolved local-looking imports and caps become blockers. |
| Deterministic components | `build_review_graph` constructs edges and union-find connected components from sealed paths; a model never emits evidence identifiers. |
| Consensus assessment | `result_from_model` invokes `gl.nondet.exec_prompt` inside `gl.vm.run_nondet`. Validators independently assess the same bounded packet and compare the settlement category. Malformed or inconsistent results fail to `UNCERTAIN`. |
| Complete certificate | `propose` requires exact component/edge coverage, derives all roots from stored evidence, and permits acceptance only when every categorical result is `ACCEPT` and blockers are empty. |
| Financial safety | `finalize`, `expire_unsealed`, and `refund_indeterminate` only credit fixed beneficiaries. State transitions prevent duplicate settlement; `withdraw` zeroes credit before external transfer. |
| UI finality | `writeBeacon` waits for `FINALIZED`, while `ReleaseMonitor` polls and renders the seal, counters, blockers, inventory, components, edges, challenge, certificate, and latest transaction. |

## Requested adversarial scenarios

| Reviewer scenario | Reproducible test evidence |
| --- | --- |
| Incomplete/truncated inventory | `test_truncated_inventory_fails_closed`; `test_inventory_and_bytes_cannot_be_supplied_by_a_caller`; mutation `test_removing_the_tree_truncation_guard_is_rejected` |
| Unresolved dependencies | `test_unresolved_dependency_and_inconsistent_assessment_cannot_accept`; resolver tests for ambiguous, escaping, relative, multiple, side-effect, dynamic, and CommonJS imports |
| Inconsistent component assessment | `test_unresolved_dependency_and_inconsistent_assessment_cannot_accept`; `test_semantic_result_is_decided_by_validator_consensus` |
| Incomplete or invalid certificate | `test_incomplete_coverage_and_invalid_certificate_cannot_settle`; `test_positive_outcome_requires_full_coverage_and_zero_blockers` |
| Expired deadline | `test_expiry_refund_credits_a_new_sponsor_balance`; mutation `test_removing_the_deadline_guard_is_rejected` |
| Unauthorized actions | `test_only_implementer_can_seal_and_challenge_roles_are_reciprocal` |
| Premature/duplicate payout | `test_finalize_cannot_pay_early_or_twice` |
| Refund and checks-effects-interactions withdrawal | `test_indeterminate_release_becomes_refundable`; `test_rejection_refunds_sponsor_and_withdraw_uses_checks_effects` |
| Empty/double withdrawal | `test_first_credit_and_empty_withdraw_are_safe`; second withdrawal assertion in `test_rejection_refunds_sponsor_and_withdraw_uses_checks_effects` |
| Frontend pending/finalized behavior | `writes wait for FINALIZED consensus state`; `represents pending wallet consensus and only reports success after finality` |
| Frontend rejected/challenged/finalized states | parameterized `represents %s releases with the correct operation`; Vault finalized-withdrawal component test |

Direct tests execute the contract through GenLayer's Direct Mode adapter. Source guards and mutation controls separately ensure the adapter cannot hide removal of production invariants.

## Finalized Studionet trace

Release `#1` uses repository `octocat/Spoon-Knife`, branch `main`, commit `d0dd1f61b33d64e29d8bc1372a94ef6a2fee76a9`, and scope `index.html`.

| Transition | Finalized transaction |
| --- | --- |
| Create and fund agreement (1 GEN) | `0x45d6268f570fd120d2594ac89e2eec7831afed336aa7a710933112add5793097` |
| Seal commit | `0x8133a445efb0405283c488e08ed1cb71eea6722d43bcde29ecb5cb1dfc0a36cd` |
| Begin inventory | `0x84411ce81ec40436f70f269e8d24d1a4791c021a93a69e6afe2e5ba28319a944` |
| Discover sealed tree | `0x1c5c78beebbadd67d823e5a5aa78ea725bcdaecb73928752298b2028c10a1464` |
| Close inventory | `0xdcb1f428650ea363fd6909a8db42a2da6248a73bc8340721f3417dd96b52165b` |
| Materialize and verify blob | `0x7857348eaea4e3a3de0bfc95d06dd5381c24af79e05f84a0363bd0546d96a22b` |
| Build review graph | `0x348a2389439c44001b82d8253b0724e3417e128395592efaf919f7f811c0d738` |
| Consensus component assessment | `0xbdda39c7df2b341e5d7adb6ef8ad5a5a2f3efcb2b2a28ea79f631d6b71635396` |
| Propose certificate | `0xe20e354c3ae1de6fc1c6c7c9b70dedd16b2133dca2398c3b37505ac3e3edbc8e` |

The assessment transaction records three agreeing validator addresses, and the certificate transaction records a separate three-vote majority. The stored coverage is `[1, 1, 1, 1, 0, 0]`, all blockers are empty, and the semantic outcome is `INDETERMINATE`. That is the expected fail-closed result for the fixture's broad obligation. Its 1 GEN escrow becomes sponsor-refundable at Unix time `1793617259` (2 November 2026, 12:00:59 WAT). No document claims this live withdrawal has happened before the timelock expires.

The production frontend can reproduce the live read at `https://bea-con.vercel.app/attestations?release=1`; the Vault at `https://bea-con.vercel.app/vault` reads pull-payment credit and submits `withdraw` directly to the same contract.

## Current external limitation

GitHub Actions is configured to run the same source, contract, mutation, and frontend checks. At this reference, GitHub refuses to start hosted jobs because the repository owner's account is locked for a billing issue. This is visible in the Actions run annotations and is not represented as a passing CI result. The local commands above remain fully reproducible while that external account issue is cleared.
