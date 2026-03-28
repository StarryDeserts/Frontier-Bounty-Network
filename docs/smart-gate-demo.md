# Smart Gate Demo Slice

Date: 2026-03-28
Status: active demo slice for the frozen Route B baseline

## Thesis

The strongest current EVE Frontier demo slice for Frontier Bounty Network is:

> Wanted players trigger Smart Gate policy.

This is the cleanest way to show that the project is not a generic Sui bounty board. It is a policy layer for programmable infrastructure.

## Why Smart Gate is the best current slice

It fits the EVE Frontier builder and gameplay model directly:
- Smart Gates already map to programmable access control
- the bounty board already expresses wanted state on-chain
- the gate policy module already exists in the contract package
- the frontend can already register that policy on-chain without any new backend dependency

This gives a demo that is:
- live enough to be credible
- simple enough to explain in 3 minutes
- clearly aligned with Smart Infrastructure rather than generic DeFi or CRUD patterns

## Policy modes

`gate_bounty` currently exposes three policy modes:
- `BLOCK`
- `SURCHARGE`
- `ALERT_ONLY`

Recommended primary path:
- `SURCHARGE`

Reason:
- it is easy for judges to understand
- it feels like player-run infrastructure economics rather than a purely punitive rule
- it demonstrates deterrence, monetization, and policy customization in one step

## What is live today

Live / chain-backed now:
- hunter registration
- bounty creation
- wanted-state reads from either indexer or direct chain mode
- gate policy registration through `gate_bounty::register_bounty_gate`
- browser-wallet transaction execution using the existing dApp flow

## What is staged today

Staged but not fully live:
- the actual Smart Gate runtime hook inside live EVE Frontier infrastructure
- automatic policy application during a real `canJump`-style decision
- real external kill-record provider for fully live claims

## Demo route

Frontend route:
- `/smart-gate-demo`

Optional builder-style query params:
- `?tenant=...`
- `?itemId=...`

Current intent:
- these params are a low-risk alignment with assembly-oriented routing
- they help frame the page like a builder-scaffold entry point
- they do not force a full app-wide assembly-native routing migration

Example:
- `/smart-gate-demo?tenant=smart-gate-demo&itemId=0xadd50afd6aac041574e50bbff5a08948d3afd5dc6358343aae8d514b8389f4f6`

## Demo story

1. Show the page title: wanted players trigger Smart Gate policy.
2. Point out the current data mode and package/object baseline.
3. Show the wanted targets derived from live bounty state.
4. Select `SURCHARGE`.
5. Register the gate policy on-chain through the frontend or the PowerShell helper.
6. Explain the predicted outcome: wanted pilots above threshold can still move, but pay a fee at the gate.
7. Close by explaining that the remaining step is to connect this policy surface into the live Smart Gate runtime.

## Scripts

PowerShell helper:
- `scripts/testnet-register-gate.ps1`

Example:
```powershell
pwsh ./scripts/testnet-register-gate.ps1 `
  -Mode 1 `
  -SurchargeMist 5000000 `
  -MinThresholdMist 25000000
```

Modes:
- `0` = `BLOCK`
- `1` = `SURCHARGE`
- `2` = `ALERT_ONLY`

## Live vs staged summary

Live now:
- on-chain bounty state
- on-chain gate policy object creation
- wallet-based transaction signing
- static-hosted frontend demo surface

Staged:
- game-side Smart Gate hook consumes the same decision
- live runtime calls the bounty policy surface automatically

## Natural next step

After the hackathon, the single most valuable continuation is:
- wire the existing gate policy surface into a real Smart Gate extension / `canJump` hook path

Turret integration remains the natural follow-on slice after that.
