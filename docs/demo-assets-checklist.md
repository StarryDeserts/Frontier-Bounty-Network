# Demo Assets Checklist

## Screenshots to prepare

Core screenshots:
- Dashboard with `Config OK`, network, and live package/object IDs visible
- Smart Gate Demo page hero section
- Smart Gate Demo page showing a non-empty wanted list
- Smart Gate Demo page with `SURCHARGE` selected
- Bounty Board with at least one live bounty visible
- Publish page with the form visible
- My Profile showing wallet-connected state and badge/object section

Optional screenshots:
- operator-assisted claim explanation section
- chain-direct mode badge visible in header

## Transaction digests to prepare

Already verified and suitable to cite:
- publish tx digest for the canonical package
- `register_hunter`
- `create_bounty`
- `issue_kill_proof`

For Smart Gate:
- `register_bounty_gate`: not included yet as a canonical recorded digest in repo docs

Use:
- `docs/live-proof-points.md`
- `docs/deployments/testnet-claim-route-b-2026-03-27.md`

## Short recordings to prepare

Recommended short clips:
- open site -> land on Smart Gate Demo -> show wanted list
- connect wallet -> register Smart Gate policy -> show tx digest
- optional backup clip: publish a bounty -> return to Smart Gate Demo -> refreshed wanted state

## Environment information to have ready

- active network: `testnet`
- current Route B package and object IDs
- whether demo is running in `chain-direct` or `auto`
- whether indexer is intentionally not used
- wallet recommendation: EV Vault

## Build and deployment facts to keep handy

- frontend can be hosted statically
- main judge path does not require a deployed indexer
- required `VITE_*` IDs are injected at build time
- SPA fallback to `index.html` is required on the host

## Final checks before recording or presenting

- `Config OK` is visible
- IDs match the canonical deployment record
- `/smart-gate-demo` loads cleanly
- wanted list is non-empty, or a backup bounty-create step is ready
- wallet is on testnet
- primary story is still `SURCHARGE`
- you have one sentence ready for what is live versus staged

## One-sentence live vs staged summary

Live today: bounty state and gate policy object creation are real on-chain actions.
Staged today: the final game-side Smart Gate runtime hook is not connected yet.
