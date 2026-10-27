# Beacon reviewer submission

> Evidence verified 27 October 2026. The immutable review tag identifies the deployed implementation; later documentation-only commits do not change the contract or frontend artifacts below.

## Canonical reference

- Repository: `https://github.com/zoefunds/beacon`
- Review tag: `reviewer-evidence-2026-10-27-v11`
- Reviewed commit: `e0e4918ff10c8baa2d1ea3d2765920a81caa1896`
- Frontend: `https://bea-con.vercel.app/`
- Immutable frontend: `https://bea-r08xz8jdj-adebiyi2002gmailcoms-projects.vercel.app`
- Studionet contract: `0xeE34e10CF770aaDbfA9C369Eec946eb5c3D164E9`
- Deployment transaction: [`0x4038…b4c8`](https://explorer-studio.genlayer.com/tx/0x4038cc6af9f83d30a7ac3daab2202a9da564bcb147046fb4405c5135ec41b4c8)
- Source: 36,764 bytes, SHA-256 `4ae0e6a0fe1f55fc4ec72c0caf5901267a2f7b557ffec250e88f0d4c3bed8d46`

The steward deployed-source fetcher independently retrieved and compiled the Studionet payload; its digest exactly matched `contract/contracts/beacon.py`. Its bundled SDK validation was unavailable because that tool lacked the pinned runner archive, while the repository's direct `genvm-lint` run passed all 3 lint checks.

## Public implementation

- [Intelligent Contract](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-27-v11/contract/contracts/beacon.py)
- [Direct lifecycle and adversarial tests](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-27-v11/contract/tests/direct/test_lifecycle.py)
- [Protocol guards](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-27-v11/contract/tests/test_source_guards.py)
- [Mutation controls](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-27-v11/contract/tests/mutation/run.py)
- [Finality-aware frontend client](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-27-v11/frontend/lib/beacon-client.ts)
- [Studionet verifier](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-27-v11/scripts/verify-studionet.mjs)

## Core guarantees

The seal binds the pre-deadline commit, commit tree, baseline tree, and observed branch head. Inventory comes from the sealed recursive Git tree, not caller- or model-emitted identifiers. Git blob bytes are recomputed, local dependencies are deterministically extracted and resolved, and every component and cross-component edge must be assessed. Unsupported content, missing or mismatched blobs, tree truncation, unresolved or ambiguous dependencies, bounds exhaustion, blockers, incomplete coverage, malformed statuses, and validator disagreement cannot create an accepted certificate.

Semantic evaluation calls `gl.nondet.exec_prompt` inside `gl.vm.run_nondet`. Validators compare the exact result and complete ordered `MET | NOT_MET | UNCERTAIN` vector. Deterministic code owns evidence identity, coverage, roots, state transitions, and money.

Funding is deliberately three-step: value-free `open_release`, non-reverting payable `deposit_funding`, then value-free validated `sponsor`. This prevents a failed validation from stranding an attached value outside accounting. Unallocated funding is withdrawable. Certificate settlement credits only fixed beneficiaries; withdrawal zeroes credit before triggering the EOA transfer.

## Final release 1 trace

Release 1 uses `octocat/Spoon-Knife`, commit `d0dd1f61b33d64e29d8bc1372a94ef6a2fee76a9`, tree `d7cee29eaada459ba458a63ad983a89915c6a10a`, and scope `index.html`.

| Event | Studionet transaction |
| --- | --- |
| Fund test wallet with 1 GEN | [`0xf3e7…387f`](https://explorer-studio.genlayer.com/tx/0xf3e70c10ba21885a344bd96d4f72d45ad191b4ae02cc9c3085e23c7b9cc0387f) |
| Create agreement without value | [`0x6303…334d`](https://explorer-studio.genlayer.com/tx/0x63033642e0a275c7602e4c6d7c7d4fa1418807045d7de9156481b3d2eb11334d) |
| Deposit exactly 1 GEN | [`0xdaec…f75a`](https://explorer-studio.genlayer.com/tx/0xdaec79cb143984d84b823833c0d9efc1b9a8686a7d07ede8eaf5828b57bcf75a) |
| Allocate deposit to release | [`0xc9be…f1a0`](https://explorer-studio.genlayer.com/tx/0xc9be84bc9bca571e935db8cb108891c0e787031d6d3cf257fe29cdd8411cf1a0) |
| Seal immutable commit | [`0xfbf1…96ac`](https://explorer-studio.genlayer.com/tx/0xfbf1ef4112996eb748dd227227131f1770e18ddd1711e172df81640303ca96ac) |
| Begin post-close inventory | [`0xbd07…74ea`](https://explorer-studio.genlayer.com/tx/0xbd0761afba5dcbc6c0cbf113fcc7adb30c2fbd69d7ad258b14d6b7f9298874ea) |
| Discover complete inventory | [`0xb420…5b4`](https://explorer-studio.genlayer.com/tx/0xb420b89917f2eda7345864281cd89ca3ed474897328ce8cf48f17729995eb5b4) |
| Close inventory | [`0xfe2b…f8e0`](https://explorer-studio.genlayer.com/tx/0xfe2b17ab9f48491e503eff6959925fdb86c1e035e474e2edfb3305d43304f8e0) |
| Byte-verify `index.html` | [`0x56e6…caf5`](https://explorer-studio.genlayer.com/tx/0x56e6c1f71eb7905bb92b4b70d5191cd76de80a639b694e44d7168598d08bcaf5) |
| Build dependency graph | [`0x5396…189e`](https://explorer-studio.genlayer.com/tx/0x5396ece97ab2af9df413929459512303cd4afb884c10e542654bd3f67af9189e) |
| Semantic assessment (`ACCEPT`, `MET`) | [`0xcefc…f2d2`](https://explorer-studio.genlayer.com/tx/0xcefc8ac7d949fb345dfc35a82ebe0d02b11e89995c8721e0a231e17beadff2d2) |
| Generate accepted certificate | [`0xdc4f…3bcc`](https://explorer-studio.genlayer.com/tx/0xdc4f8e45fa67c429d95cd9a1ae0aa8a537e55d4c85c0bbd61ce6cebe9bbd3bcc) |
| Premature finalize rolls back | [`0xce4a…983a`](https://explorer-studio.genlayer.com/tx/0xce4a2ec175194e41331f83791e2bd1882343b85b4e017a4578a7e74cd17b983a) |
| Finalize after challenge window | [`0x2c0b…b72a`](https://explorer-studio.genlayer.com/tx/0x2c0b51a43d925857cb171fa7ce996e67a0a3a3b6fbab9b6e235eba046f52b72a) |
| Duplicate finalize rolls back | [`0x5ce5…634e`](https://explorer-studio.genlayer.com/tx/0x5ce5d65664ce363b6f3da23fb6298001f3068300b43e5a4bb62cb984bc85634e) |
| Beneficiary withdrawal | [`0x4b4e…f7a0`](https://explorer-studio.genlayer.com/tx/0x4b4ec2750e5e6bc615181e8a8643c462d8bd16c1762b55f76213ddb2ff2cf7a0) |
| Triggered 1 GEN EOA transfer | [`0xab85…26cc`](https://explorer-studio.genlayer.com/tx/0xab85ab79dc746e7ac2fe90dd79170bf37ca0d908bf50ba33f661077b251926cc) |
| Second withdrawal emits no transfer | [`0xa2c4…81fa`](https://explorer-studio.genlayer.com/tx/0xa2c4b180c2a2231276b982314e93425e97eb0f16d9b36ab718e3e28a538281fa) |

Final state and certificate outcome are `ACCEPTED`, coverage is `[1,1,1,1,0,0]`, blockers are empty, and six 64-hex commitment roots are stored. Contract settlement and funding balances are both zero after withdrawal. The production view is [release 1](https://bea-con.vercel.app/attestations?release=1).

## Reproduce

```sh
git clone https://github.com/zoefunds/beacon.git
cd beacon
git checkout reviewer-evidence-2026-10-27-v11
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

Expected: 38 protocol guards, 41 contract tests, 20 mutation controls, successful production build, 20 frontend tests, 3 GenVM lint checks, 0 production vulnerabilities, matching deployed source, and passing live/public/frontend verifiers.
