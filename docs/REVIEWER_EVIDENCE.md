# Reviewer evidence

> Evidence snapshot verified 27 October 2026.

The canonical public review reference is `reviewer-evidence-2026-10-27-v12`. Start with [`../REVIEWER_SUBMISSION.md`](../REVIEWER_SUBMISSION.md) for direct source links and the active deployment record.

## Artifact identity

- Contract: `0x3244f824cD071D564071AD5ad8207953a0A04Efb`
- Reviewed commit: `7d2c0b6b7d1a2c8ec20458e331c46c633d3ae77d`
- Deployment: `0xf5863c8d931f250430261570129a51ebb4f11c8251502b4c862ef4bc8497008c`
- Source SHA-256: `406376022834a27cc6b53a13ea7168de0d2709bd94288eff3d9a01c159b85d35`
- Source size: 43,247 bytes
- Frontend: `https://bea-con.vercel.app/`
- Immutable frontend: `https://bea-oq7tlnoeg-adebiyi2002gmailcoms-projects.vercel.app`
- Vercel deployment: `dpl_63hpRvuraJ8oPWmwCvHsk7g1ipsL`

`npm run evidence:live` uses `gen_getContractCode` to retrieve the deployed contract and match the local source byte-for-byte. The deployment transaction finalized with majority agreement and successful leader execution; the direct repository `genvm-lint` run passed all 3 checks.

## Historical lifecycle trace

The transactions below are a complete lifecycle trace on the superseded contract `0xeE34e10CF770aaDbfA9C369Eec946eb5c3D164E9`. They substantiate the prior escrow lifecycle only. They are explicitly not claimed as proof of a certificate issued by the active hardened contract, which adds baseline-change and successful-runtime-check requirements.

That historical release was sealed to commit `d0dd1f61b33d64e29d8bc1372a94ef6a2fee76a9` and tree `d7cee29eaada459ba458a63ad983a89915c6a10a`. The scoped `index.html` blob was verified, deterministic coverage was `[1,1,1,1,0,0]`, blockers were empty, and native validator consensus returned `ACCEPT` with obligation status `MET`.

The certificate commits these roots:

- agreement: `a00f780b284424780617e08e60c6a1782baba3d710637cb593c1a33cacf3f655`
- seal: `3adb0e26eea2904ca4f8a6716c3063b6eee19bec9d1a9976c776ae6e438f6347`
- inventory: `b6df8542582d43c6342c2b08f3a4fb33a3d96e233ce76f90fd8efe36f23b507f`
- assessment: `9378d36c8871dff961b319b21da4992b5ccf417bc682080f13e2e73836f28a36`
- edges: `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945`
- obligations: `7801a49a9fe713bc618e0d381d9b7eeac0daf25116b599d943748bbe034a6d41`

Transaction `0xce4a2ec175194e41331f83791e2bd1882343b85b4e017a4578a7e74cd17b983a` proves premature finalization rolls back while the challenge window is open. Finalization `0x2c0b51a43d925857cb171fa7ce996e67a0a3a3b6fbab9b6e235eba046f52b72a` succeeds after the window; duplicate finalization `0x5ce5d65664ce363b6f3da23fb6298001f3068300b43e5a4bb62cb984bc85634e` rolls back. Withdrawal `0x4b4ec2750e5e6bc615181e8a8643c462d8bd16c1762b55f76213ddb2ff2cf7a0` triggers the 1 GEN transfer `0xab85ab79dc746e7ac2fe90dd79170bf37ca0d908bf50ba33f661077b251926cc`; repeat withdrawal `0xa2c4b180c2a2231276b982314e93425e97eb0f16d9b36ab718e3e28a538281fa` emits no transfer. The active source verifier deliberately checks only the active deployment source, not these superseded transactions.

## Adversarial coverage

Tests cover incomplete and truncated inventories, missing or mismatched blobs, unsupported content, unresolved and ambiguous dependencies, import/edge/component/source bounds, incomplete assessments, invalid certificates, malformed status vectors, validator disagreement, unauthorized seal and challenge calls, premature and duplicate settlement, rejection routing, expiry, double withdrawal, value-safe funding, and exact seven-day indeterminate recovery.

`npm run check` passes 48 protocol guards, 54 contract tests, 28 mutation controls, a production build, and 20 frontend tests. GenVM lint passes 3 checks and the production dependency audit reports 0 vulnerabilities.

GitHub Actions is configured but cannot currently start jobs because of the repository owner's billing lock. No CI run is represented as passing.
