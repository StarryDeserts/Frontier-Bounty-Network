# Frontier Bounty Network

Frontier Bounty Network is an EVE Frontier-native bounty infrastructure dApp on Sui.

Current submission story:
- **Wanted players trigger Smart Gate policy**
- live bounty state becomes a policy surface for player-run infrastructure
- the current judge-facing demo shows how wanted status can drive `BLOCK`, `SURCHARGE`, or `ALERT_ONLY` gate behavior

## Why this belongs in EVE Frontier

This project is not positioned as a generic Sui bounty board.
It is positioned as Smart Infrastructure:
- a player-run wanted registry
- a future Smart Gate policy layer
- a future Smart Turret threat signal
- a bridge from future kill records into on-chain settlement

If judges only open one page, they should open:
- `/smart-gate-demo`

## Recommended demo page

Open:
- `/smart-gate-demo`

Recommended main story:
1. show live wanted targets derived from bounty state
2. select `SURCHARGE`
3. register a Smart Gate policy on-chain
4. explain the resulting infrastructure behavior

Why `SURCHARGE` is the best main path:
- easy to understand
- clearly tied to player-run infrastructure economics
- demonstrates deterrence without needing a harsh denial-only story

## Current official testnet baseline

Canonical deployment record:
- `docs/deployments/testnet-claim-route-b-2026-03-27.md`

This is the only default live baseline for the repo.

## What is live today

Live and chain-backed now:
- `register_hunter`
- `create_bounty`
- production `issue_kill_proof`
- `register_bounty_gate`
- chain-direct frontend reads
- static-hostable frontend that does not require a hosted indexer for the main demo path

## What is still staged

Not fully live yet:
- real Smart Gate runtime hook inside the game world
- real external kill-record provider
- trust-minimized verifier / attestor path
- Smart Turret runtime hookup

## Quickstart

Install:
```bash
pnpm -C frontend install
pnpm -C indexer install
```

Frontend-only judge path:
```bash
pnpm -C frontend typecheck
pnpm -C frontend build
pnpm -C frontend dev
```

Recommended public demo mode:
- `VITE_DATA_MODE=chain-direct`
- no indexer required
- EV Vault recommended for EVE Frontier players

## Build-time env

Required for the frontend build:
- `VITE_SUI_NETWORK`
- `VITE_DATA_MODE`
- `VITE_PACKAGE_ID`
- `VITE_BOUNTY_BOARD_ID`
- `VITE_CLAIM_REGISTRY_ID`
- `VITE_KILL_PROOF_ISSUER_CAP_ID`
- `VITE_CLOCK_ID`

Important:
- these values are injected at build time
- if they are missing or invalid, the frontend build fails

## Chain-direct coverage

Works without indexer:
- Dashboard
- Smart Gate Demo
- Bounty Board
- Bounty Detail
- Publish
- My Profile base object view
- wallet connect and transaction flows

## Best docs to read next

Submission materials:
- `docs/submission-final.md`
- `docs/demo-script-3min.md`
- `docs/judge-quickstart.md`
- `docs/demo-assets-checklist.md`

Project framing:
- `docs/hackathon-submission-summary.md`
- `docs/smart-gate-demo.md`
- `docs/why-smart-gate-first.md`
- `docs/project-status.md`
- `docs/live-proof-points.md`

Technical context:
- `docs/eve-frontier-alignment.md`
- `docs/claim-live-plan.md`
- `docs/indexerless-mode.md`
- `docs/known-limitations.md`
- `docs/deferred-roadmap.md`
