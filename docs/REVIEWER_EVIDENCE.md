# Reviewer evidence

> Evidence snapshot verified 28 October 2026.

The canonical public review reference is `reviewer-evidence-2026-10-27-v13`. Start with [`../REVIEWER_SUBMISSION.md`](../REVIEWER_SUBMISSION.md) for direct source links and the active deployment record.

## Artifact identity

- Contract: `0x37c8de10d3cC7ba4353608441A57a917e9628618`
- Reviewed implementation commit: `dda9adbde0d7d797943fd030d85dbae36a2a47c9`
- Deployment: `0x26abab424352d9b30938aa7d9dd06a5d0cb0f713c48f9460ba2903527d11e0ab`
- Source SHA-256: `d0f8c3b612836503f3558421a9b84a94e76afd6219dbeeea696927c45b0718e2`
- Source size: 45,544 bytes
- Frontend: `https://bea-con.vercel.app/`
- Immutable frontend: `https://bea-3ymhr18yh-adebiyi2002gmailcoms-projects.vercel.app`
- Vercel deployment: `dpl_AV3Ayae1L21oUudRXEYmBqqN5fQf`

`npm run evidence:live` uses `gen_getContractCode` to retrieve the deployed contract and match the local source byte-for-byte. The deployment transaction finalized with majority agreement and successful leader execution; the direct repository `genvm-lint` run passed all 3 checks.

## Active lifecycle evidence

Active releases 1 and 2 were fully funded, sealed, inventoried, byte-verified, semantically assessed, proposed as `ACCEPTED`, and challenged. Both challenge assessments returned `UNCERTAIN`; the contract changed each certificate to `INDETERMINATE`, set the seven-day refund deadline, and did not credit or transfer escrow. These traces independently demonstrate that uncertain challenge output cannot lead to or preserve an accepted certificate.

Active release 3 uses the same public `sindresorhus/yoctocolors` commit, exact one-file scope, and required `Node.js 18` and `Node.js 23` checks from the `github-actions` app. Its seal records `check_total: 2`, both checks successful for the exact commit, plus committed runtime and runtime-policy roots. The full transaction table is maintained in [`../REVIEWER_SUBMISSION.md`](../REVIEWER_SUBMISSION.md).

## Adversarial coverage

Tests cover incomplete and truncated inventories, missing or mismatched blobs, unsupported content, unresolved and ambiguous dependencies, import/edge/component/source bounds, incomplete assessments, invalid certificates, malformed status vectors, validator disagreement, check pagination mismatch, missing required check identities, unapproved check apps, failed checks, wrong check commits, unauthorized seal and challenge calls, premature and duplicate settlement, rejection routing, expiry, double withdrawal, value-safe funding, and exact seven-day indeterminate recovery.

`npm run check` passes 53 protocol guards, 59 contract tests, 32 mutation controls, a production build, and 20 frontend tests. GenVM lint passes 3 checks and the production dependency audit reports 0 vulnerabilities.

GitHub Actions is configured but cannot currently start jobs because of the repository owner's billing lock. No CI run is represented as passing.
