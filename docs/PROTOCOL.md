# Beacon protocol

> Protocol description verified 27 October 2026 against `reviewer-evidence-2026-10-27-v11`.

Beacon is an escrow agreement between sponsors and an implementer. It evaluates a named, pre-sealed repository release against explicit obligations.

## Release seal

Before `seal_by`, the implementer submits a commit SHA. Validators fetch the named Git ref, verify that the commit is reachable from it, prove that the declared baseline is an ancestor of the commit, fetch the commit tree, and store the exact commit/tree pair. Replacement seals are allowed only before `seal_by`; there is no operation that samples a branch after the deadline. Empty or incomplete seals are rejected. If no valid seal exists, the agreement expires into sponsor refunds.

## Inventory before judgment

The agreement includes one or more normalized repository paths. Bounded traversal builds a canonical inventory of the complete sealed tree and binds the baseline tree in the seal. Entries may be `TEXT`, `BINARY`, or `SUBMODULE`. A missing or unsupported entry is not omitted: it receives a coverage blocker. Unchanged entries remain in the sealed inventory and are part of the certificate root, allowing obligations that concern retained code, configuration, or fixtures to be checked.

## Two evidence lanes

1. **Mechanical lane.** Blob bytes are verified against Git object hashes. Parsers extract local Python and JavaScript/TypeScript imports and exports. Every resolvable edge is mandatory coverage.
2. **Semantic lane.** Validators classify bounded component packets against each obligation. Validators compare both the settlement result and the complete ordered obligation-status vector; explanatory text is retained as evidence but cannot make consensus artificially brittle. Their observations are never authoritative for dependency completeness.

Components are constructed from deterministic graph connectivity rather than model-issued labels. Python relative and absolute-local imports plus JavaScript/TypeScript static, side-effect, dynamic, and CommonJS imports are covered. Unresolved local references and parser limits become blockers. Cross-component edges create mandatory compatibility checks.

## Finality

Positive release requires exact coverage equality: all inventory entries materialized, all components assessed, all mandatory edges reviewed, and no blockers. The certificate has separate roots for the full agreement, seal, blob-bound inventory, reviewed graph edges, assessments, and obligations. A challenge names a committed inventory entry and causes reassessment. Funds use pull payments.

For a provisional acceptance, sponsors may challenge a committed entry during the review window. For a provisional rejection, the implementer has the reciprocal right. Reassessment uses the same sealed source evidence. A non-decisive assessment produces `INDETERMINATE`; after a seven-day review period, anyone may move its escrow into sponsor pull-payment balances.

The acceptance/rejection challenge window is 20 minutes. `INDETERMINATE` certificates cannot be challenged or finalized as accepted/rejected; `refund_indeterminate` becomes available after exactly seven days. Settlement, expiry, and indeterminate recovery credit internal balances first. Each beneficiary withdraws that credit separately, and the balance is zeroed before transfer. Withdrawals use GenLayer's EOA transfer interface rather than an Intelligent-Contract call; an empty or repeated withdrawal returns without emitting another transfer.

## Operational bounds

| Input or workload | Maximum |
| --- | ---: |
| Obligations per agreement | 6 |
| Characters per obligation | 1,000 |
| Scope roots | 8 |
| Characters per scope path | 240 |
| Ref and title characters | 120 each |
| Inventory entries | 192 |
| Text blob bytes | 48,000 |
| Local imports per file | 32 |
| Dependency edges | 256 |
| Connected components | 96 |
| Source characters per semantic component | 30,000 |

The minimum initial escrow is 1 GEN. A release deadline must be at least five minutes in the future when the agreement is opened. Any exhausted parser, graph, source, or inventory bound prevents a positive certificate instead of silently dropping evidence.

## Public contract interface

Lifecycle writes are `open_release`, `deposit_funding`, `sponsor`, `withdraw_funding`, `seal_release`, `begin_inventory`, `discover_inventory`, `close_inventory`, `materialize`, `build_review_graph`, `assess_component`, `review_edge`, `propose`, `challenge_certificate`, `review_challenge`, `finalize`, `expire_unsealed`, `refund_indeterminate`, and `withdraw`.

`deposit_funding` accepts GEN into the caller's unallocated funding balance without performing release validation. `sponsor` subsequently allocates a requested amount to an existing draft release, and `withdraw_funding` returns any unallocated balance. This separation ensures failed agreement validation cannot strand attached value outside the contract's accounting.

`open_release` normalizes the GenLayer runtime `Address` representation before validating and storing the implementer. This keeps browser/SDK address-shaped calldata compatible with the canonical lowercase address used by later authorization checks.

Read methods are `get_release`, `get_entry`, `get_edge`, `get_component`, `get_balance`, and `get_next_id`. JSON views preserve integer identifiers; the frontend parses release IDs as `bigint` so values beyond JavaScript's safe-integer range are not rounded.
