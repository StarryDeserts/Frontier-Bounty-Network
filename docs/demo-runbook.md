# Demo Runbook

Date: 2026-03-28
Goal: stable 5-10 minute EVE Frontier Smart Gate x Bounty demo with or without a live indexer.

## Recommended modes

For a public judge-facing URL:
- use a static frontend only
- set `VITE_DATA_MODE=chain-direct`
- do not require an indexer server

For an operator-led local demo:
- use `VITE_DATA_MODE=auto`
- start the indexer if you want richer leaderboard/history projections
- let the frontend fall back automatically if the indexer is unavailable

## Current live deployment values

Canonical Route B deployment:
- `PACKAGE_ID=0x8c03f8415d7a4af75c9dc95fdbfe7e64de611bb26f5e7bb8a1197443f6c4accd`
- `BOUNTY_BOARD_ID=0xadd50afd6aac041574e50bbff5a08948d3afd5dc6358343aae8d514b8389f4f6`
- `CLAIM_REGISTRY_ID=0xf30348954b620a4d2c761e34132782b4559153a077309d30217131182631b671`
- `KILL_PROOF_ISSUER_CAP_ID=0x21af175fcbb2024923339f5c871bf1856bc731002904966b3b20ae40418d6539`
- `CLOCK_ID=0x6`

## Frontend-only startup

```bash
pnpm -C frontend install
pnpm -C frontend typecheck
pnpm -C frontend build
pnpm -C frontend dev
```

Use env:
- `VITE_DATA_MODE=chain-direct`
- leave `VITE_INDEXER_API_URL` empty
- leave `VITE_INDEXER_WS_URL` empty

## Frontend + indexer startup

Terminal A:
```bash
pnpm -C indexer build
pnpm -C indexer start
```

Terminal B:
```bash
pnpm -C frontend dev
```

Checks:
- `http://localhost:3001/health`
- `http://localhost:5173`

## Demo path classification

Fully available in chain-direct mode:
- wallet connect
- `register_hunter`
- `create_bounty`
- `register_bounty_gate`
- Dashboard baseline telemetry
- Smart Gate demo page
- Bounty Board
- Bounty Detail
- My Profile base badge/object view

Degraded but still present in chain-direct mode:
- Hunter Ranking
- recent claims panels
- recent activity feed
- broad historical aggregates

Manual / operator-assisted:
- `POST /api/claim-proof/resolve`
- `issue_kill_proof` by the issuer-cap holder

## Recommended judge demo flow

Primary story:
- wanted players trigger Smart Gate policy

Recommended route:
1. Open the static frontend and show that it loads in `Direct Chain Mode`.
2. Open `/smart-gate-demo`.
3. Show the page title and explain that this is a Smart Infrastructure policy slice, not a generic bounty board.
4. Point out the optional `tenant` / `itemId` query-param entry and frame it as builder-style routing alignment.
5. Show the live wanted target list derived from current bounty state.
6. Select `SURCHARGE` as the policy mode.
7. Connect wallet, ideally with EV Vault.
8. Register the Smart Gate policy on-chain using the page button.
9. Show the transaction digest.
10. Explain the predicted result: a wanted pilot above threshold can still transit, but pays a penalty at the gate.
11. Close by explaining that the only staged part is the final Smart Gate runtime hook.

## Optional setup before the demo

If the wanted list is empty:
1. open `Publish`
2. create a bounty
3. return to `/smart-gate-demo`
4. refresh the wanted list

Optional PowerShell helper:
```powershell
pwsh ./scripts/testnet-register-gate.ps1 `
  -Mode 1 `
  -SurchargeMist 5000000 `
  -MinThresholdMist 25000000
```

## Optional operator demo

If you want to show the broader system after the Smart Gate slice:
1. open Bounty Board and inspect the live bounty object
2. open My Profile and show badge/object ownership
3. explain that claim remains operator-assisted until a real kill-record provider is integrated

## Fallback guidance

If the indexer is offline or not deployed:
- do nothing special when the frontend is in `auto`
- it will drop to direct chain reads automatically
- for a judge-facing deployment, prefer `chain-direct` explicitly to avoid a startup health-probe delay
