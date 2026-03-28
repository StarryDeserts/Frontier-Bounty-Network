# Acceptance Checklist (Release Candidate Finalization)

Date: 2026-03-27
Scope: final verification, Route B baseline freeze, scripts, demo readiness, handoff readiness.

## 1) Baseline consistency

| Area | Check | Result | Notes |
|---|---|---|---|
| Contracts docs | canonical package/object IDs match current Route B deployment | PASS | Route B package `0x8c03f8415d7a4af75c9dc95fdbfe7e64de611bb26f5e7bb8a1197443f6c4accd` is the only default live baseline. |
| Historical package handling | old package is marked historical only | PASS | Old package remains documented only in superseded deployment records. |
| Env samples | root/indexer/frontend env samples point to Route B package | PASS | `.env.example`, `indexer/.env.example`, `frontend/.env.example` aligned. |

## 2) Build / typecheck / smoke matrix

| Area | Check | Command | Result | Notes |
|---|---|---|---|---|
| Contracts | Build | `cd contracts/frontier_bounty && sui move build` | PASS | Build succeeds; lint warnings only. |
| Contracts | Test | `cd contracts/frontier_bounty && sui move test` | PASS | 10/10 tests passed on Route B source baseline. |
| Indexer | Typecheck | `pnpm -C indexer typecheck` | PASS | No TS errors. |
| Indexer | Build | `pnpm -C indexer build` | PASS | `dist/` generated. |
| Indexer | Checkpoint smoke | `pnpm -C indexer checkpoint:smoke` | PASS | Resume, dedupe, force backfill, reset, rebuild all verified. |
| Frontend | Typecheck | `pnpm -C frontend typecheck` | PASS | No TS errors. |
| Frontend | Build | `pnpm -C frontend build` | PASS | Build succeeds; large chunk warning only. |

## 3) Live smoke verification

Environment used:
- active env: `testnet`
- active address: `0xc558e37d20405a9751c81124ac8d167e2b2d368b834319adafa549449e0715f5`
- funding coin: `0xac319653fd254e8bc0f35c9211fb509979f0cb007d25e0d97f1ab9ddac62f549`
- gas coin: `0x4c3b0cd0f7dc720fa7326cd4e81630ce606984c54f6c46182eff2ba83e99a5b5`

Verified with:
- `pwsh ./scripts/testnet-live-smoke.ps1 -FundingCoinId <funding> -GasObjectId <gas> -IncludeKillProof`

Observed Route B results:
- `register_hunter` tx: `4hHmQLii8gHxPJtpKV29qXpNMttmifGbfsKMcu2zrxX7`
- hunter badge: `0x9d7c5217be959a9509fa7e5f7ab1e5608cf649023db27d191516057c2c41fc63`
- `create_bounty` tx: `GpTsNoCAUR5BXpA3BeXVAYdCHogWuWqT3a4iYVdN2rSG`
- bounty id: `0xa5fe5ab3aec4171c42fe4886d8832d20823cee4545ba8c3326c6e8eb8e1304e8`
- payment coin: `0xc58223286c6c2b1bf11d36d297844eb6b99411ffd4cdd56f3a515b4c3f72a103`
- `issue_kill_proof` tx: `7ia16rcsXwQsSPJS3mPwmt55NZpnPLhNTdBTjn2svpLS`
- kill proof id: `0x57d3b0df7dde7d9623e3818db5f9b94c012a44622a62c6b525c93c0050c1b189`

Interpretation:
- live register path works
- live bounty creation path works
- manual/operator-issued production `KillProof` path works
- fully automated provider-backed claim is still not part of this release candidate

## 4) Script readiness

Validated scripts:
- `scripts/testnet-register-hunter.ps1`
- `scripts/testnet-create-bounty.ps1`
- `scripts/testnet-issue-kill-proof.ps1`
- `scripts/testnet-live-smoke.ps1`

Notes:
- scripts use Route B defaults but allow overrides through parameters and env
- scripts do not hardcode secrets
- `testnet-live-smoke.ps1` keeps proof issuance behind `-IncludeKillProof`

## 5) Non-blocking findings

- frontend build still warns about a large chunk
- `node:sqlite` remains experimental in Node
- Move lint warnings remain
- claim is `live-ready but awaiting external provider`, not fully live
