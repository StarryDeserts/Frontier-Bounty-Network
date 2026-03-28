# Judge Quickstart

## If you only want the fastest understanding

Read these in order:
1. `README.md`
2. `docs/submission-final.md`
3. `docs/smart-gate-demo.md`
4. `docs/live-proof-points.md`

## If you want to run the frontend locally

Install dependencies:
```bash
pnpm -C frontend install
```

Run in static-friendly direct mode:
```bash
pnpm -C frontend typecheck
pnpm -C frontend build
pnpm -C frontend dev
```

Recommended env:
- `VITE_DATA_MODE=chain-direct`
- real Route B package and object IDs injected at build time

## If you want to deploy or inspect the static site

Minimum build-time env:
- `VITE_SUI_NETWORK`
- `VITE_DATA_MODE`
- `VITE_PACKAGE_ID`
- `VITE_BOUNTY_BOARD_ID`
- `VITE_CLAIM_REGISTRY_ID`
- `VITE_KILL_PROOF_ISSUER_CAP_ID`
- `VITE_CLOCK_ID`

If you do not provide these real values at build time, the static artifact is not valid.

## Recommended page to visit first

Open:
- `/smart-gate-demo`

This is the clearest judge-facing slice of the project.

## Recommended demo path

1. Open `/smart-gate-demo`.
2. Show that the app can run in `chain-direct` mode.
3. Show live wanted targets derived from current bounty state.
4. Keep `SURCHARGE` selected.
5. Connect wallet.
6. Register the Smart Gate policy on-chain.
7. Show the tx digest and explain the predicted gate behavior.

## Which capabilities do not require an indexer

These work in `chain-direct` mode:
- wallet connect
- `register_hunter`
- `create_bounty`
- `register_bounty_gate`
- Smart Gate demo page
- Bounty Board
- Bounty Detail
- My Profile base object view

## Why claim is still operator-assisted

Claim is not fully automated yet because the real external kill-record provider is not integrated.

What exists today:
- a live on-chain proof issuance boundary
- a live claim entrypoint
- a manual issuer path for controlled demos

What is still missing:
- a real provider-backed verifier flow that can safely issue proofs automatically

So the current claim status is:
- `live-ready but awaiting external provider`

## If you want one document that summarizes the project state

Read:
- `docs/project-status.md`
