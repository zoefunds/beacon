# Reviewer verification reference

This reference maps Beacon's security claims to source, automated tests, production bundles, and finalized Studionet transactions. It reports only the active deployment's successful lifecycle evidence and the two intentional rollback probes used to verify replay protection.

## Immutable reference

- Repository: `https://github.com/zoefunds/beacon`
- Review tag: `reviewer-evidence-2026-10-26-v7`
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
git checkout reviewer-evidence-2026-10-26-v7
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

At this reference, `npm run check` passes 28 protocol guards, 33 direct contract tests, 10 mutation controls, a production build, and 15 frontend tests. GenVM lint passes and the production dependency audit reports zero vulnerabilities. `evidence:live` independently fetches every cited active transaction, asserts finality and majority agreement where consensus applies, verifies both exact 1 GEN escrows and EOA transfers, checks final balances, proves replay calls emitted no duplicate transfer or credit, and verifies active validator consensus for semantic assessment. `evidence:frontend` fetches all four production routes and their JavaScript bundles. `evidence:public` fetches the contract, nested tests, frontend integration, and verifier from the exact public commit.

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

The active component assessment `0x2f82fbb82394976a208c28f9cbc761292d365f7987a2ca49b8fbc352dd7627b2` and certificate proposal `0x8c13f4d0919a1107c64324ad7e9bc561e74a637146f45f834ac649951eaf95de` each record three agreeing validator addresses. `npm run evidence:live` re-fetches and checks those votes. The deterministic coverage was complete, but native semantic reasoning returned `REJECT`; the resulting certificate is therefore `REJECTED`, demonstrating that the nondeterministic lane determines the semantic outcome rather than decorating a deterministic approval.

## Active full certificate and refund trace

Release `#2` on the active contract uses `octocat/Spoon-Knife`, baseline and sealed commit `d0dd1f61b33d64e29d8bc1372a94ef6a2fee76a9`, sealed tree `d7cee29eaada459ba458a63ad983a89915c6a10a`, and scope `index.html`.

| Event | Finalized transaction |
| --- | --- |
| Open and escrow exactly 1 GEN | [`0x1e6b…c3b8f`](https://explorer-studio.genlayer.com/tx/0x1e6b5314982df60b9c6c3a2021a9d74a0695a7ce2fac6c0d92fc1bbd0f3c3b8f) |
| Seal commit before deadline | [`0xac65…625e3`](https://explorer-studio.genlayer.com/tx/0xac65cc9c8e2994bb39972875b1f79b4e243b783e365a06975d174cdb41a625e3) |
| Post-deadline substitution rolls back | [`0x8cc2…0c0ae`](https://explorer-studio.genlayer.com/tx/0x8cc278f31a1cf5dad4858c5c7485e6be87e0f0c07681dbce1342b3fa35b0c0ae) |
| Begin canonical inventory | [`0xd469…8c9d`](https://explorer-studio.genlayer.com/tx/0xd46990ee217d1bc3182ef7d91738534dd1ad3d31ba6b9e1fd2606fa5583c8c9d) |
| Discover complete scoped inventory | [`0x2387…c518`](https://explorer-studio.genlayer.com/tx/0x23873975ab69e61d5e5d66688df67bc7b5575e7d0abec5b7ec43f40ef221c518) |
| Close inventory | [`0xbb02…be06`](https://explorer-studio.genlayer.com/tx/0xbb02452e7450995c1ed5144750045ec8f955fb370d73c5ed1109275ddff6be06) |
| Verify `index.html` bytes and Git blob | [`0x124a…50a6`](https://explorer-studio.genlayer.com/tx/0x124ad12772063d6aec70c17384ea3fd4b3b298d43c90a17f62887d64d8a150a6) |
| Build deterministic component graph | [`0xb8d7…e96`](https://explorer-studio.genlayer.com/tx/0xb8d7e02764054edb31b5577aa90dc71806bedec2347d5cffcc56fe19d23fae96) |
| Native semantic assessment, three agreeing votes | [`0x2f82…627b2`](https://explorer-studio.genlayer.com/tx/0x2f82fbb82394976a208c28f9cbc761292d365f7987a2ca49b8fbc352dd7627b2) |
| Propose `REJECTED` certificate, three agreeing votes | [`0x8c13…95de`](https://explorer-studio.genlayer.com/tx/0x8c13f4d0919a1107c64324ad7e9bc561e74a637146f45f834ac649951eaf95de) |
| Finalize after challenge window | [`0xf603…1c17`](https://explorer-studio.genlayer.com/tx/0xf60399d05baef7c75c5cd544dffff0576d45683c20de2faee8cc74c749e61c17) |
| Duplicate finalization rolls back `invalid_state` | [`0x7b29…b795`](https://explorer-studio.genlayer.com/tx/0x7b29cadfe3b0d7215db67db4f205dec5053494a61331f09c585513a9bab5b795) |
| Withdraw sponsor refund | [`0x431b…4190`](https://explorer-studio.genlayer.com/tx/0x431b31750e068e77740978dbb82c3d392862aad372f45782fd9d277a44634190) |
| Triggered EOA transfer of exactly 1 GEN | [`0xe15f…08aa`](https://explorer-studio.genlayer.com/tx/0xe15f2996e6def7199ab0bd5fc1fb83b20b6e85a7be30b298478f40f9ae8908aa) |
| Second withdrawal, no transfer | [`0xaa1b…f3fb`](https://explorer-studio.genlayer.com/tx/0xaa1b25028cf9b2989113c5c9f01375fbc693a9d6c6859bcff81003ffef3cf3fb) |

Final state is `REJECTED`; certificate coverage is `[1, 1, 1, 1, 0, 0]`; blockers are empty; the stored Git blob is `a83618bcf17b4e8e643de75d09adc0e892043020`. The certificate commits agreement root `f00acc2853f3d8d68641b386a5c3d69d22b055227fd3ee3027f1d20964b9c8e8`, seal root `3adb0e26eea2904ca4f8a6716c3063b6eee19bec9d1a9976c776ae6e438f6347`, inventory root `b6df8542582d43c6342c2b08f3a4fb33a3d96e233ce76f90fd8efe36f23b507f`, edge root `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945`, assessment root `a2070d4d4a6838d087608fb7384c2ad117dd5179439e91cab0a7143676e44bb1`, and obligation root `56c57768b9d4ed838a64aba66e1f4ed19dff1e420cf959eede1450e11b110c51`. Final contract credit is zero and the wallet balance is exactly 1 GEN.

## External CI limitation

GitHub Actions contains the same checks and receives each branch and review-tag push. The repository owner's account billing lock currently causes both jobs to fail with zero executed steps. The current state is visible on the [Beacon verification runs page](https://github.com/zoefunds/beacon/actions/workflows/ci.yml). This is an external CI availability limitation, not a passing run or an implementation failure. All local and live verification commands above remain reproducible.
