# Live Proof Points

Date: 2026-03-28
Purpose: evidence that can be shown directly to judges or referenced in submission material

## Canonical testnet baseline

Current official baseline:
- `PACKAGE_ID=0x8c03f8415d7a4af75c9dc95fdbfe7e64de611bb26f5e7bb8a1197443f6c4accd`
- `BOUNTY_BOARD_ID=0xadd50afd6aac041574e50bbff5a08948d3afd5dc6358343aae8d514b8389f4f6`
- `CLAIM_REGISTRY_ID=0xf30348954b620a4d2c761e34132782b4559153a077309d30217131182631b671`
- `KILL_PROOF_ISSUER_CAP_ID=0x21af175fcbb2024923339f5c871bf1856bc731002904966b3b20ae40418d6539`
- `CLOCK_ID=0x6`
- publish tx: `7eZyfo5vNteQ7uKToqU6Cm4tZ2ctpSH7TyacsgSmHsSz`

Source of record:
- `docs/deployments/testnet-claim-route-b-2026-03-27.md`

## Verified testnet transaction digests

Verified and already recorded:
- `register_hunter`: `5fjso2PHzHa9JnT75fG2GL6FHkuiKxnN5W4mBAhtGtFk`
- `create_bounty`: `4UhuVaEjvvax9rQLcsxzBHfzFBuJ29sF4QM92NF1Eq8q`
- `issue_kill_proof`: `7i9YWuU1Eg1puh5y1GWTUw7Yu53DRXaDQC12RLQNNBey`

Additional live smoke digests recorded later:
- `register_hunter`: `4hHmQLii8gHxPJtpKV29qXpNMttmifGbfsKMcu2zrxX7`
- `create_bounty`: `GpTsNoCAUR5BXpA3BeXVAYdCHogWuWqT3a4iYVdN2rSG`
- `issue_kill_proof`: `7ia16rcsXwQsSPJS3mPwmt55NZpnPLhNTdBTjn2svpLS`

For Smart Gate policy registration:
- canonical recorded digest: not included yet
- current repo includes the live call path in frontend and `scripts/testnet-register-gate.ps1`

## What has succeeded on real testnet

Real testnet success already demonstrated for:
- package publish
- hunter registration
- bounty creation
- production proof issuance

Smart Gate status:
- supported by the live package and frontend transaction builder
- intended as the current main demo slice
- canonical tx digest not yet captured in repo deployment records

## Frontend pages that support chain-direct mode

Usable without indexer:
- Dashboard
- Smart Gate Demo
- Bounty Board
- Bounty Detail
- Publish
- My Profile base object view
- wallet connect and wallet-triggered transactions

## Verification commands already passed

Confirmed in repository history:
- `cd contracts/frontier_bounty; sui move build; sui move test`
- `pnpm -C indexer typecheck`
- `pnpm -C indexer build`
- `pnpm -C indexer checkpoint:smoke`
- `pnpm -C frontend typecheck`
- `pnpm -C frontend build`

## Facts you can point to during the demo

Safe claims to make:
- the package is live on Sui testnet
- hunter registration and bounty creation are already verified on-chain
- the frontend can run without a hosted indexer
- the Smart Gate policy surface exists in the live package and is exposed in the frontend
- claim is not fully automated yet; it remains operator-assisted pending a real kill-record provider

## Facts you should not overclaim

Do not claim yet:
- live Smart Gate runtime integration inside the game world
- full automated claim verification
- decentralized verifier trust model
- canonical recorded Smart Gate tx digest in repo docs
