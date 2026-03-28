# Handoff

Date: 2026-03-28

## System state

The repository is handoff-ready for a testnet MVP demo and is now explicitly positioned as an EVE Frontier bounty infrastructure dApp rather than a generic Sui demo.

Summary:
- contracts are frozen and already published on testnet
- indexer remains available for enhanced reads, but is no longer required for the frontend to operate
- frontend supports dual read paths and can be deployed as a static site with direct chain reads
- claim is not mock-only anymore, but it is still not fully live
- EV Vault is the recommended wallet path for EVE Frontier players, while the current frontend remains on the low-risk Mysten wallet stack

## EVE Frontier positioning

This project should be explained as:
- a bounty board and deterrence layer for player-run infrastructure
- a future policy input for Smart Gates and Smart Turrets
- a future bridge from game kill records into on-chain reward settlement

Current gameplay mapping:
- `bounty_registry` = player-published wanted contracts
- `bounty_verify` + issuer flow = bridge from future kill records into claim settlement
- `gate_bounty` = Smart Gate access-control policy hook around future `canJump` decisions
- `turret_bounty` = Smart Turret threat-prioritization hook for bounty-aware defense

Read first:
- `docs/eve-frontier-alignment.md`
- `docs/hackathon-submission-summary.md`

## Three-layer completion status

Contracts:
- stable Route B baseline
- no further contract changes required for the current pass
- designed to remain compatible with future Smart Gate / Smart Turret / kill-record integrations

Indexer:
- REST API implemented
- HTTP polling + startup backfill implemented
- persistent checkpoint / dedupe implemented
- claim proof adapter boundary implemented
- optional enhancement layer, not mandatory for public frontend deployment

Frontend:
- dashboard, board, detail, publish, ranking, profile pages implemented
- dual data source support implemented
- indexerless static deployment supported
- UI refreshed to a premium tactical console
- wallet UX now explicitly guides EVE Frontier players toward EV Vault

## Canonical testnet baseline

Use this package as the only default live baseline:
- `PACKAGE_ID=0x8c03f8415d7a4af75c9dc95fdbfe7e64de611bb26f5e7bb8a1197443f6c4accd`
- `BOUNTY_BOARD_ID=0xadd50afd6aac041574e50bbff5a08948d3afd5dc6358343aae8d514b8389f4f6`
- `CLAIM_REGISTRY_ID=0xf30348954b620a4d2c761e34132782b4559153a077309d30217131182631b671`
- `KILL_PROOF_ISSUER_CAP_ID=0x21af175fcbb2024923339f5c871bf1856bc731002904966b3b20ae40418d6539`
- publish tx: `7eZyfo5vNteQ7uKToqU6Cm4tZ2ctpSH7TyacsgSmHsSz`

Historical only:
- `0x589e0cabc806514d8320beafb2108caef427527429ecaadb410842e2c838a0dc`

## Current builder/frontend alignment

Current stack:
- `@mysten/dapp-kit` provider and hooks
- `useCurrentAccount` and `useSignAndExecuteTransaction`
- `SuiClient` direct reads for objects and events
- optional indexer for richer read models

Why this is acceptable right now:
- official EVE Frontier builder docs still rely on Wallet Standard and Mysten transaction primitives under the hood
- this dApp does not yet need assembly-specific `tenant + itemId` routing or sponsored transaction flows
- static-hosting and low integration risk matter more than replacing the stack for branding reasons alone

When to revisit EF SDK migration:
- when the product becomes assembly-centric
- when EV Vault-only onboarding is a hard requirement
- when GraphQL assembly transforms or sponsored transactions become core to the UX

## Current trust boundary

`KillProofIssuerCap` is a temporary centralized trust point.
- it is held by the package publisher by default
- issuance is manual and operator-controlled
- compromise or mis-issuance can create bogus `KillProof` objects
- this is acceptable for current testnet demo scope, but not the end-state design

## Local startup

Frontend only:
```bash
pnpm -C frontend install
pnpm -C frontend dev
```

Frontend + indexer:
```bash
pnpm -C indexer build
pnpm -C indexer start
pnpm -C frontend dev
```

## Recommended hosted deployment

For a public demo site:
- deploy the frontend only
- set `VITE_DATA_MODE=chain-direct`
- leave indexer URLs empty
- configure SPA fallback to `index.html`
- recommend EV Vault to players in the UI and docs

## Reset and rebuild indexer sync state

Commands:
- `pnpm -C indexer sync:reset`
- `pnpm -C indexer sync:rebuild`
- `pnpm -C indexer checkpoint:smoke`

True rebuild:
1. `pnpm -C indexer sync:rebuild`
2. restart once with `FORCE_FULL_BACKFILL=true`

## First files the next developer should read

Frontend:
- `frontend/src/App.tsx`
- `frontend/src/providers/SuiProvider.tsx`
- `frontend/src/services/data-source.service.ts`
- `frontend/src/services/chain-data.service.ts`
- `frontend/src/services/app-data.service.ts`
- `frontend/src/components/common/WalletButton.tsx`
- `docs/indexerless-mode.md`

Contracts and claim:
- `contracts/frontier_bounty/sources/bounty_registry.move`
- `contracts/frontier_bounty/sources/bounty_verify.move`
- `docs/claim-live-plan.md`
- `docs/deployments/testnet-claim-route-b-2026-03-27.md`

Indexer:
- `indexer/src/claim/providers/frontier.ts`
- `indexer/src/event-listener.ts`
- `indexer/src/db/repository.ts`
- `indexer/src/scripts/checkpoint-smoke.ts`

## Immediate guidance

Do not:
- republish the package unless intentionally rolling a new baseline
- assume indexer availability for the public frontend path
- treat current chain-direct ranking/history as a full substitute for projected analytics
- claim EV Vault-specific or game-native integration that the repo has not actually implemented

Do next:
- follow `docs/deferred-roadmap.md`
- preserve the frozen Route B baseline unless an approved contract upgrade is planned
- use `docs/eve-frontier-alignment.md` as the architecture decision record for future EVE-native integration choices
