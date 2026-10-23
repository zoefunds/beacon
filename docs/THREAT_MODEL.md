# Threat model

Beacon assumes public Git hosts return a consistent API response to validators under GenLayer consensus. It does not trust a sponsor, implementer, browser, or semantic model to choose evidence selectively.

| Risk | Control |
| --- | --- |
| Branch moves after close | A validated pre-deadline release seal is the sole review source. |
| Omitted dependency | Deterministic parsers build the mandatory local graph; semantic labels are additive. |
| Hidden unchanged input | Both baseline and sealed trees are inventoried under scope. |
| Invalid or altered source | Blob payload and computed Git object SHA must match the inventory. |
| Unsupported material | Classified blocker; it cannot disappear from coverage. |
| Oversized repository | Bounded cursors and explicit caps; cap exhaustion cannot settle positively. |
| Transfer re-entry | Credit balances are zeroed before pull transfer. |

GenLayer consensus is used for remote source facts and bounded semantic classifications. State transitions, graph construction, coverage accounting, Merkle-style commitments, and settlement are deterministic.
