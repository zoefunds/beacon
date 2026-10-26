# Threat model

Beacon assumes public Git hosts return a consistent API response to validators under GenLayer consensus. It does not trust a sponsor, implementer, browser, or semantic model to choose evidence selectively.

| Risk | Control |
| --- | --- |
| Branch moves after close | A validated pre-deadline release seal is the sole review source. |
| Omitted dependency | Deterministic parsers build the mandatory local graph; semantic labels are additive. |
| Import parser exhaustion | Per-file import and global edge caps become certificate blockers. |
| Hidden unchanged input | The complete sealed tree is inventoried under scope; baseline ancestry and its tree hash are committed in the seal. |
| Invalid or altered source | Blob payload and computed Git object SHA must match the inventory. |
| Unsupported material | Classified blocker; it cannot disappear from coverage. |
| Oversized repository | Bounded cursors and explicit caps; cap exhaustion cannot settle positively. |
| Transfer re-entry | Credit balances are zeroed before pull transfer. |
| Missing balance key | First credits and empty withdrawals use explicit `TreeMap` membership checks. |
| Non-decisive model result | Seven-day review followed by permissionless sponsor refund; no permanent escrow lock. |

GenLayer consensus is used for remote source facts and bounded semantic classifications. State transitions, graph construction, coverage accounting, SHA-256 commitments, refund timing, and settlement are deterministic.
