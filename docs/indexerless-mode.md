# Indexerless Frontend Mode

Date: 2026-03-28
Status: supported for static-hosted judge/demo deployments

## Summary

The frontend supports two data paths:
- `indexer`: uses the existing REST API for richer projections and faster historical reads
- `chain-direct`: reads shared objects and Move events directly from Sui testnet through `@mysten/sui` RPC queries

The application automatically falls back to `chain-direct` when `VITE_DATA_MODE=auto` and the configured indexer cannot pass the `/health` probe.

## Build-time config requirement

The frontend does not discover package/object IDs at runtime.
These values are injected by Vite at build time through `VITE_*` env vars.

That means:
- a static deployment must be built with real Route B IDs already present
- leaving required IDs empty, invalid, or `0x0` breaks the artifact
- `pnpm -C frontend build` now fails fast when required chain IDs are missing or invalid

Quick verification:
- header shows `Config OK`
- Dashboard and sidebar show the same canonical IDs used by transactions
- browser console logs `[frontend-config] resolved`

## Recommended deployment for judges

Use a static frontend with no backend requirement:
- `VITE_DATA_MODE=chain-direct`
- `VITE_INDEXER_API_URL=`
- `VITE_INDEXER_WS_URL=`

Build and deploy:
```bash
pnpm -C frontend install
pnpm -C frontend build
```

Deploy `frontend/dist` to any static host that supports SPA fallback routing.

## Chain-direct implementation

Current chain-direct reads use the official Sui TypeScript client and the frozen Route B testnet baseline:
- `SuiClient.getObject()` for shared singleton objects such as `BountyBoard` and `ClaimRegistry`
- `SuiClient.getOwnedObjects()` for wallet-owned `HunterBadge` objects
- `SuiClient.queryEvents()` for `BountyCreatedEvent`, `HunterRegisteredEvent`, `BountyVerifiedEvent`, and related activity

This keeps wallet connect and transaction execution unchanged while removing the requirement for a long-running indexer.

## Fully available without indexer

The following remain functional in `chain-direct` mode:
- wallet connect
- `register_hunter`
- `create_bounty`
- Dashboard baseline telemetry
- Bounty Board
- Bounty Detail
- My Profile base badge and published-bounty view
- package / board / claim registry visibility

## Gracefully degraded without indexer

The following still render, but with simplified or recent-window data:
- Hunter Ranking
- recent claims panels
- recent activity feed
- high-level aggregates that depend on broad historical projection

Current degradation behavior:
- the UI shows explicit mode badges and warnings
- pages do not hard-fail when indexer-enhanced data is unavailable
- chain-direct views favor recent event windows and directly readable shared-object counters

## Required frontend env

Always set at build time:
- `VITE_SUI_NETWORK`
- `VITE_DATA_MODE`
- `VITE_PACKAGE_ID`
- `VITE_BOUNTY_BOARD_ID`
- `VITE_CLAIM_REGISTRY_ID`
- `VITE_KILL_PROOF_ISSUER_CAP_ID`
- `VITE_CLOCK_ID`

Optional, only when indexer exists:
- `VITE_INDEXER_API_URL`
- `VITE_INDEXER_WS_URL`
- `VITE_INDEXER_HEALTH_TIMEOUT_MS`

## Operational notes

- static hosting still requires SPA fallback routing to `index.html`
- the frontend continues to sign and submit wallet transactions directly to Sui in either mode
- claim remains operator-assisted because the external kill-record provider is still not integrated
