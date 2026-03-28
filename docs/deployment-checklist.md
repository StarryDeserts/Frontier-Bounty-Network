# Deployment Checklist

Date: 2026-03-27
Target: Sui testnet + static frontend hosting + hosted/local indexer.

## 1) Current deployment values

Canonical Route B deployment:
- `PACKAGE_ID=0x8c03f8415d7a4af75c9dc95fdbfe7e64de611bb26f5e7bb8a1197443f6c4accd`
- `BOUNTY_BOARD_ID=0xadd50afd6aac041574e50bbff5a08948d3afd5dc6358343aae8d514b8389f4f6`
- `CLAIM_REGISTRY_ID=0xf30348954b620a4d2c761e34132782b4559153a077309d30217131182631b671`
- `KILL_PROOF_ISSUER_CAP_ID=0x21af175fcbb2024923339f5c871bf1856bc731002904966b3b20ae40418d6539`
- `CLOCK_ID=0x6`
- Publish tx: `7eZyfo5vNteQ7uKToqU6Cm4tZ2ctpSH7TyacsgSmHsSz`

Superseded package:
- `0x589e0cabc806514d8320beafb2108caef427527429ecaadb410842e2c838a0dc`
- Keep it only as historical data. Frontend, indexer, scripts, and docs should all point to the Route B package above.

Still fill per environment:
- `VITE_INDEXER_API_URL`
- `VITE_INDEXER_WS_URL`
- `CORS_ORIGIN`

## 2) Contract status

Route B package is already published on testnet. Do not republish unless intentionally rolling another package.

If you need to re-check the current deployment:
1. `sui client object 0x8c03f8415d7a4af75c9dc95fdbfe7e64de611bb26f5e7bb8a1197443f6c4accd --json`
2. `sui client tx-block 7eZyfo5vNteQ7uKToqU6Cm4tZ2ctpSH7TyacsgSmHsSz --json`

## 3) Indexer live mode

Required env:
- `PACKAGE_ID`
- `BOUNTY_BOARD_ID`
- `CLAIM_REGISTRY_ID`
- `KILL_PROOF_ISSUER_CAP_ID`
- `SUI_RPC_URL=https://fullnode.testnet.sui.io:443`
- `EVENT_POLL_INTERVAL_MS=4000`
- `FORCE_FULL_BACKFILL=false`
- `USE_MOCK_EVENTS=false`
- `ENABLE_EVENT_LISTENER=true`
- `MOCK_SEED_ON_START=false`
- `CLAIM_PROOF_PROVIDER=disabled`
- `CLAIM_PROOF_ISSUER_MODE=manual`

Important:
- inbound chain ingestion uses `queryEvents` HTTP polling
- startup resumes from `event_checkpoints` unless `FORCE_FULL_BACKFILL=true`
- duplicate chain events are ignored through `processed_chain_events`
- frontend websocket (`/ws/events`) is still served by the indexer itself

Run:
1. `pnpm -C indexer install`
2. `pnpm -C indexer build`
3. `pnpm -C indexer start`
4. Verify:
   - `GET /health`
   - `GET /api/bounties`
   - `GET /api/hunters/leaderboard`
   - `GET /api/stats`

Reset and rebuild:
- reset checkpoints only: `pnpm -C indexer sync:reset`
- clear checkpoints plus projections: `pnpm -C indexer sync:rebuild`
- true projection rebuild:
  1. `pnpm -C indexer sync:rebuild`
  2. restart once with `FORCE_FULL_BACKFILL=true`

## 4) Frontend static deployment

Set build-time env:
- `VITE_SUI_NETWORK=testnet`
- `VITE_PACKAGE_ID=0x8c03f8415d7a4af75c9dc95fdbfe7e64de611bb26f5e7bb8a1197443f6c4accd`
- `VITE_BOUNTY_BOARD_ID=0xadd50afd6aac041574e50bbff5a08948d3afd5dc6358343aae8d514b8389f4f6`
- `VITE_CLAIM_REGISTRY_ID=0xf30348954b620a4d2c761e34132782b4559153a077309d30217131182631b671`
- `VITE_INDEXER_API_URL=<https://your-indexer-domain>`
- `VITE_INDEXER_WS_URL=<wss://your-indexer-domain/ws/events>`

Build and deploy:
1. `pnpm -C frontend install`
2. `pnpm -C frontend build`
3. Upload `frontend/dist`

## 5) PowerShell operator scripts

Scripts are aligned to the Route B baseline:
- `scripts/testnet-register-hunter.ps1`
- `scripts/testnet-create-bounty.ps1`
- `scripts/testnet-issue-kill-proof.ps1`
- `scripts/testnet-live-smoke.ps1`

Use them for operator-driven testnet validation and demo setup.

## 6) Claim proof resolution mode switch

Default live mode:
- `CLAIM_PROOF_PROVIDER=disabled`
- `CLAIM_PROOF_ISSUER_MODE=manual`

Controlled operator demo:
- `CLAIM_PROOF_PROVIDER=mock`
- call `POST /api/claim-proof/resolve`
- execute returned PowerShell command from the wallet holding `KILL_PROOF_ISSUER_CAP_ID`

Future real provider:
- `CLAIM_PROOF_PROVIDER=frontier`
- set `FRONTIER_KILL_API_BASE_URL`
- replace the stub with the real kill-record adapter

## 7) Remaining live limitation

Claim is no longer mock-only, but it is not fully live either.

Current status:
- `live-ready but awaiting external provider`

Meaning:
- the contract now has a production `issue_kill_proof` boundary
- the repo can resolve proof drafts and output a manual issuance command
- the real external kill-record provider is still missing, so automated live claim is not yet the default deployment path
