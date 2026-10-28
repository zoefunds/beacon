# Threat model

> Threat model verified 28 October 2026 against `reviewer-evidence-2026-10-27-v13` and the active Studionet lifecycle traces.

Beacon assumes public Git hosts return a consistent API response to validators under GenLayer consensus. It does not trust a sponsor, implementer, browser, or semantic model to choose evidence selectively.

| Risk | Control |
| --- | --- |
| Branch moves after close | A validated pre-deadline release seal is the sole review source. |
| Omitted dependency | Deterministic parsers build the mandatory local graph; semantic labels are additive. |
| Model omits or invents identifiers | Models never select inventory paths, component membership, or dependency edges; those identifiers are constructed deterministically from sealed evidence. |
| Import parser exhaustion | Per-file import and global edge caps become certificate blockers. |
| Hidden unchanged input | The complete sealed tree is inventoried under scope; baseline ancestry and its tree hash are committed in the seal. |
| Invalid or altered source | Blob payload and computed Git object SHA must match the inventory. |
| Unsupported material | Classified blocker; it cannot disappear from coverage. |
| Oversized repository | Bounded cursors and explicit caps; cap exhaustion cannot settle positively. |
| Transfer re-entry | Credit balances are zeroed before pull transfer. |
| EOA treated as an Intelligent Contract | Withdrawals use the explicit EOA transfer interface; direct tests and active release 3 record the successful 1 GEN transfer. |
| Missing balance key | First credits and empty withdrawals use explicit `TreeMap` membership checks. |
| Runtime address type mismatch | Address-shaped calldata is normalized before validation and canonical storage. |
| Non-decisive model result | Seven-day review followed by permissionless sponsor refund; no permanent escrow lock. |
| First post-deadline caller selects evidence | `begin_inventory` only advances the already stored seal and never reads the moving branch. |
| Release hides its effective delta | The pre-deadline seal commits a bounded baseline-to-release manifest and its root; invalid, oversized, or incomplete API data fails closed. |
| Runtime check omitted by pagination | The seal requests 100 checks, bounds the response at 32, and requires returned length to equal GitHub's `total_count`; an incomplete page cannot seal. |
| Irrelevant green check substituted | Sponsors commit required check name/app pairs in the agreement; every required identity must be present, every returned check must target the sealed commit, and all returned checks must succeed. |
| Duplicate discovery or transition calls | Discovery is explicitly one-shot; later methods require exact state and coverage counters. |
| Validator prose differs | Consensus compares both the bounded settlement category and the complete ordered obligation-status vector while retaining prose only as supporting evidence. |
| Contradictory semantic acceptance | Normalization, component aggregation, and challenge review each reject an obligation-bearing `ACCEPT` unless every ordered status is `MET`. |
| Selected-entry challenge hides contextual evidence | Challenge review rebuilds the complete containing component and its incident cross-component edges, including sealed baseline and runtime evidence. |
| Mechanical completeness mistaken for acceptance | Native semantic assessment and successful public runtime evidence are mandatory; deterministic coverage alone cannot settle. |
| Certificate replay | `finalize` requires the exact `REVIEW` state and moves to a terminal state before crediting; direct tests cover duplicate settlement and withdrawal. |

GenLayer consensus is used for remote source facts and bounded semantic classifications. State transitions, graph construction, coverage accounting, SHA-256 commitments, refund timing, and settlement are deterministic.

## Residual assumptions

Beacon currently supports public GitHub repositories through GitHub's canonical REST objects. Availability or rate limiting can delay progress, but malformed, missing, truncated, oversized, or inconsistent responses fail closed. The conservative import extractor covers supported local Python and JavaScript/TypeScript forms; syntax outside those bounded forms cannot yield positive settlement if it appears to be an unresolved local reference. Semantic classification may still reject or remain uncertain. Rejection refunds sponsors after the reciprocal challenge window; uncertainty intentionally routes funds to the delayed sponsor-refund path rather than guessing.
