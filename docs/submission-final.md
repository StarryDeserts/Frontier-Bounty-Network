# Submission Final

## Project name

Frontier Bounty Network

## One-line introduction

An EVE Frontier-native bounty infrastructure dApp on Sui that turns wanted-player state into Smart Gate policy.

## Short submission blurb

Frontier Bounty Network is a Smart Infrastructure demo slice for EVE Frontier. It lets players publish live bounties on Sui, then shows how that wanted state can drive Smart Gate policy such as BLOCK, SURCHARGE, or ALERT_ONLY. The current demo focuses on a clear, chain-backed Smart Gate x Bounty flow that works from a static frontend without requiring a hosted indexer.

## Problem definition

EVE Frontier is built around programmable infrastructure, but bounty systems are usually presented as isolated reward boards rather than as inputs to world policy.

That misses a more compelling use case:
- infrastructure operators need a programmable way to react to wanted players
- gates and defensive systems need a policy layer, not just a static allowlist
- hunters and infrastructure owners need a shared signal that can affect access, risk, and deterrence

## Solution

Frontier Bounty Network turns bounty state into infrastructure policy.

In the current demo slice:
- players register as hunters
- players create live bounties on Sui testnet
- the frontend derives wanted state from live bounty data
- a Smart Gate policy object can be registered on-chain with one of three modes:
  - `BLOCK`
  - `SURCHARGE`
  - `ALERT_ONLY`
- the demo explains the resulting gate behavior and how the same policy surface can later plug into a live Smart Gate runtime

## Why this fits EVE Frontier

This project fits EVE Frontier because it is about:
- player-driven order and deterrence
- programmable infrastructure
- access control as gameplay
- service economies around security, routing, and defense

The current Smart Gate slice is especially strong because it shows a direct bridge from on-chain player intent to future world behavior.

## Current completed capabilities

Implemented today:
- Sui Move bounty contracts published to testnet
- hunter registration
- bounty creation
- chain-direct frontend that works without a deployed indexer
- optional indexer for richer reads
- operator-assisted proof issuance boundary for claims
- Smart Gate policy registration surface exposed in frontend and scripts

## Current live / chain-backed capabilities

Live and chain-backed now:
- `register_hunter`
- `create_bounty`
- `issue_kill_proof` for the issuer-cap holder
- `register_bounty_gate`
- chain-direct reads of bounty state from the frontend
- wallet-based transaction signing from a static-hosted frontend

## Current staged / future integration capabilities

Staged, not fully live yet:
- live Smart Gate runtime hookup inside EVE Frontier
- fully automated claim verification against a real kill-record provider
- trust-minimized verifier or attestor path
- Smart Turret runtime integration

## Technical architecture summary

Three-layer architecture:
- `contracts/frontier_bounty`: on-chain bounty, claim, gate, and turret policy modules
- `indexer`: optional projection and claim-proof preparation layer
- `frontend`: static-hostable React tactical console with `indexer` and `chain-direct` read modes

Current baseline:
- Route B testnet package
- no contract changes required for submission
- no hosted indexer required for the main demo path

## Why this is a Smart Infrastructure use case

This is not just a reward board.
It is a policy surface for player-run infrastructure.

The key idea is:
- bounties define who is wanted
- infrastructure decides what wanted status means
- gates and defensive systems can consume that state to shape movement, risk, and deterrence

That is exactly the kind of programmable world logic EVE Frontier is designed to support.

## Current demo main path

Recommended judge flow:
1. Open the frontend in `chain-direct` mode.
2. Go to `/smart-gate-demo`.
3. Show live wanted targets derived from bounty state.
4. Select `SURCHARGE`.
5. Register the Smart Gate policy on-chain.
6. Explain the resulting behavior: a wanted pilot above threshold can still transit, but pays a fee.
7. Explain that the remaining staged step is connecting this same policy surface into the live Smart Gate runtime.

## Most important next steps

Only the highest-value next steps:
1. Connect the existing gate policy surface to a real Smart Gate extension or `canJump` hook.
2. Integrate the real EVE Frontier kill-record provider for claim verification.
3. Upgrade the current centralized proof issuance trust boundary to a safer verifier path.
