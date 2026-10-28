# Beacon reviewer submission

> Evidence verified 28 October 2026. The immutable review tag identifies the deployed implementation; later documentation-only commits do not change the contract or frontend artifacts below.

## Canonical reference

- Repository: `https://github.com/zoefunds/beacon`
- Review tag: `reviewer-evidence-2026-10-27-v13`
- Frontend: `https://bea-con.vercel.app/`
- Immutable frontend: `https://bea-3ymhr18yh-adebiyi2002gmailcoms-projects.vercel.app`
- Vercel deployment: `dpl_AV3Ayae1L21oUudRXEYmBqqN5fQf`
- Studionet contract: `0x37c8de10d3cC7ba4353608441A57a917e9628618`
- Deployment transaction: [`0x26ab…e0ab`](https://explorer-studio.genlayer.com/tx/0x26abab424352d9b30938aa7d9dd06a5d0cb0f713c48f9460ba2903527d11e0ab)
- Source: 45,544 bytes, SHA-256 `d0f8c3b612836503f3558421a9b84a94e76afd6219dbeeea696927c45b0718e2`

`npm run evidence:live` retrieves the active Studionet source through `gen_getContractCode` and compares it byte-for-byte to `contract/contracts/beacon.py`. The new deployment finalized under majority agreement, and the repository's direct `genvm-lint` run passed all 3 lint checks.

## Public implementation

- [Intelligent Contract](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-27-v13/contract/contracts/beacon.py)
- [Focused invariant and lifecycle tests](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-27-v13/contract/tests/direct/test_lifecycle.py)
- [Protocol guards](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-27-v13/contract/tests/test_source_guards.py)
- [Mutation controls](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-27-v13/contract/tests/mutation/run.py)
- [Finality-aware frontend client](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-27-v13/frontend/lib/beacon-client.ts)
- [Studionet source verifier](https://github.com/zoefunds/beacon/blob/reviewer-evidence-2026-10-27-v13/scripts/verify-studionet.mjs)

## Core guarantees

The seal binds the pre-deadline commit, commit tree, baseline tree, observed branch head, scoped baseline-to-release change manifest, complete bounded GitHub check-run response, and sponsor-approved required check name/app policy. The returned check count must equal GitHub's `total_count`; every returned check must target the sealed commit and complete successfully; every required identity must be present. Inventory comes from the sealed recursive Git tree, not caller- or model-emitted identifiers. Git blob bytes are recomputed, local dependencies are deterministically extracted and resolved, and every component and cross-component edge must be assessed. Unsupported content, missing or mismatched blobs, tree truncation, unresolved or ambiguous dependencies, bounds exhaustion, blockers, incomplete coverage, malformed statuses, validator disagreement, and incomplete runtime evidence cannot create an accepted certificate.

Semantic evaluation calls `gl.nondet.exec_prompt` inside `gl.vm.run_nondet`. Validators compare the exact result and complete ordered `MET | NOT_MET | UNCERTAIN` vector. `ACCEPT` is valid only when every obligation status is `MET`; component assessment, certificate aggregation, and challenge review each enforce this independently. Challenge review reconstructs the complete challenged component and incident dependency edges, then includes sealed baseline and runtime evidence. Deterministic code owns evidence identity, coverage, roots, state transitions, and money.

Funding is deliberately three-step: value-free `open_release`, non-reverting payable `deposit_funding`, then value-free validated `sponsor`. This prevents a failed validation from stranding an attached value outside accounting. Unallocated funding is withdrawable. Certificate settlement credits only fixed beneficiaries; withdrawal zeroes credit before triggering the EOA transfer.

## Active deployment lifecycle trace

Release 3 on the active contract completed the full funded lifecycle against `sindresorhus/yoctocolors` commit `a85b98a90e5731914567d8c209e7ec45ac2d24e2`. The seal contains exactly two successful checks for that commit—`Node.js 18@github-actions` and `Node.js 23@github-actions`—and commits the required-check policy. The component assessment returned `ACCEPT` with status `MET`; the certificate has coverage `[1,1,1,1,0,0]`; finalization occurred only after the full 20-minute challenge window; withdrawal transferred exactly 1 GEN and left the contract credit at zero.

| Event | Active Studionet transaction |
| --- | --- |
| Create agreement | [`0x3ffb…c541`](https://explorer-studio.genlayer.com/tx/0x3ffbc588bdbdc952d71906a6f93e94187d1007681c5a78a6a749cb21f660c541) |
| Deposit 1 GEN | [`0x3488…4206`](https://explorer-studio.genlayer.com/tx/0x34887dc7236f48cc8e4f85a10945bc88281f256f7d24a8dfce68966a15954206) |
| Allocate escrow | [`0xd2fd…0b1d`](https://explorer-studio.genlayer.com/tx/0xd2fd3038b3ad259ded92651427ebf4cc437bbc7df11dbfa919eff26b34c30b1d) |
| Seal commit, complete checks, and check policy | [`0x0bf6…8115`](https://explorer-studio.genlayer.com/tx/0x0bf69dd93ea2aa6b20b4724e4b6bf4dc3d6dece520b7a40290ae5d1912378115) |
| Begin post-deadline inventory | [`0xe803…05c6`](https://explorer-studio.genlayer.com/tx/0xe8034f82296af0463d06016972af4cec969aa2b4f66543d12ce2f539b2df05c6) |
| Discover complete scoped inventory | [`0x6419…57f8`](https://explorer-studio.genlayer.com/tx/0x6419260e04535c9cbe0c8f6f794937a4eabca0e6f8915aca9a2cf60d00f157f8) |
| Close inventory | [`0x2c93…8a3c`](https://explorer-studio.genlayer.com/tx/0x2c93c234d627649a34df2ce4397bb1abc5397b3b139843e73841da0e8d478a3c) |
| Byte-verify scoped blob | [`0x4f48…bd5b`](https://explorer-studio.genlayer.com/tx/0x4f48a2affa80afe620b1e8ada4eefca20b08e7bb2c339a4d479c4284cf96bd5b) |
| Build review graph | [`0xf568…b867`](https://explorer-studio.genlayer.com/tx/0xf568e04c9bc10725a254e2eed094709f81c5205878e39b8f6a20ad6bca60b867) |
| Native semantic assessment (`ACCEPT`, `MET`) | [`0xddbe…50cc`](https://explorer-studio.genlayer.com/tx/0xddbeff037e0828a96348a5cda0691f537b4558217263e775f1e09eaf0d8f50cc) |
| Generate accepted certificate | [`0xccb4…a0a5`](https://explorer-studio.genlayer.com/tx/0xccb4d11ad0ea839f30f30b3e09e64cceabda6ad45f7fc7a7d759d94f0094a0a5) |
| Finalize after challenge window | [`0x2b0b…4e2a`](https://explorer-studio.genlayer.com/tx/0x2b0b9859411655733de00bbe390aba37af5e801dbc549c2df7c5218b95654e2a) |
| Withdraw beneficiary credit | [`0xbe9c…c243`](https://explorer-studio.genlayer.com/tx/0xbe9c8ea8c7a535379f45bee894a1d92d1af5b097ba61adc53c26d50d216ec243) |
| Triggered 1 GEN transfer | [`0x1b34…789d`](https://explorer-studio.genlayer.com/tx/0x1b34cd0d88b50f8099a9b9660d1ef4d49322bc97cfb1650a43a2edb5a9ec789d) |

Active releases 1 and 2 separately prove fail-closed challenge handling. Each was provisionally accepted, challenged, and reassessed as `UNCERTAIN`; reviews [`0x7ff0…0e5e`](https://explorer-studio.genlayer.com/tx/0x7ff0cded0100a6c3f7de2d6b23d051b5b388bd2af6e6ee522f40ecf9eab70e5e) and [`0xf33f…6c1c`](https://explorer-studio.genlayer.com/tx/0xf33f468e37e0d4ab2751e7cd6d56487060c5d8f4091f60c7b8edf67540006c1c) changed the certificates to non-settleable `INDETERMINATE` instead of preserving acceptance.

## Historical lifecycle trace

Release 1 is a historical complete-lifecycle trace on the superseded contract. The active hardened contract above is source-verified separately and requires successful public runtime checks for any future payout.

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

The historical trace reached `ACCEPTED` with coverage `[1,1,1,1,0,0]`; it documents escrow mechanics only and is not evidence for the new runtime-evidence rule. The active deployment is verified by `npm run evidence:live`.

## Reproduce

```sh
git clone https://github.com/zoefunds/beacon.git
cd beacon
git checkout reviewer-evidence-2026-10-27-v13
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

Expected: 53 protocol guards, 59 contract tests, 32 mutation controls, successful production build, 20 frontend tests, 3 GenVM lint checks, 0 production vulnerabilities, matching deployed source, and passing live/public/frontend verifiers.
