# Final Demo Checklist

Date: 2026-03-28
Default public demo baseline: static frontend in `chain-direct` mode against the Route B testnet package

## Before the demo

Confirm:
- wallet is on `testnet`
- env files point at the Route B package, not the historical package
- the frontend build was produced with the intended `VITE_DATA_MODE`
- the build injected real Route B package/object IDs before `pnpm -C frontend build`
- the header shows `Config OK`
- Dashboard or sidebar IDs match the canonical deployment record
- if using `chain-direct`, `VITE_INDEXER_API_URL` and `VITE_INDEXER_WS_URL` are empty or omitted
- if using `auto` with a local indexer, `http://localhost:3001/health` returns OK
- `/smart-gate-demo` is reachable
- the wanted list is non-empty, or you have time to publish one bounty during the demo

## Recommended deployment modes

Judge-facing hosted site:
- `VITE_DATA_MODE=chain-direct`
- static frontend only
- no indexer dependency

Operator local demo:
- `VITE_DATA_MODE=auto`
- optional indexer running locally for richer history

## Required env values

Always, at build time:
- `VITE_SUI_NETWORK`
- `VITE_DATA_MODE`
- `VITE_PACKAGE_ID`
- `VITE_BOUNTY_BOARD_ID`
- `VITE_CLAIM_REGISTRY_ID`
- `VITE_KILL_PROOF_ISSUER_CAP_ID`
- `VITE_CLOCK_ID`

Only when indexer exists:
- `VITE_INDEXER_API_URL`
- `VITE_INDEXER_WS_URL`
- `VITE_INDEXER_HEALTH_TIMEOUT_MS`

## What is live in the hosted frontend

- wallet connect
- `register_hunter`
- `create_bounty`
- `register_bounty_gate`
- Dashboard baseline telemetry
- Smart Gate demo page
- Bounty Board
- Bounty Detail
- My Profile base badge/object reads

## What is staged or simulated

- Smart Gate runtime hook inside the live game environment
- actual `canJump` extension execution against the registered policy object
- fully automated claim verification against a real kill-record provider

## Recommended main sequence

1. show the `Config OK` badge and confirm the IDs shown in Dashboard
2. open `/smart-gate-demo`
3. explain that this is the current EVE Frontier-native slice: wanted players trigger Smart Gate policy
4. show the live wanted target list
5. keep `SURCHARGE` selected
6. connect wallet, ideally with EV Vault
7. register the Smart Gate policy on-chain
8. show the transaction digest
9. explain the expected gate behavior: wanted pilots above threshold can still move, but must pay a fee
10. optionally show Bounty Board or Publish if judges ask where the wanted state comes from

## Backup sequence if judges want more chain action

1. publish a bounty from the `Publish` page
2. return to `/smart-gate-demo`
3. refresh the wanted list
4. repeat the policy explanation

## Operator script fallback

If you prefer a shell-driven step instead of the button:
```powershell
pwsh ./scripts/testnet-register-gate.ps1 `
  -Mode 1 `
  -SurchargeMist 5000000 `
  -MinThresholdMist 25000000
```
