# Hackathon Submission Summary

## Project

Frontier Bounty Network

## One-line positioning

An EVE Frontier bounty infrastructure dApp built on Sui, designed to plug into Smart Assemblies, Smart Gates, Smart Turrets, and future kill-record flows.

## Current demo slice

The strongest current demo slice is:

> Wanted players trigger Smart Gate policy.

This is the clearest proof that the project belongs in the EVE Frontier builder ecosystem rather than as a generic Sui dApp.

## What it does today

Live now:
- hunter registration on Sui testnet
- bounty creation on Sui testnet
- Smart Gate policy registration on Sui testnet
- chain-direct frontend that works without a deployed indexer
- optional indexer for richer reads
- operator-assisted proof issuance boundary for claims

## Why this matters in EVE Frontier

EVE Frontier is about programmable infrastructure, access control, deterrence, and player-run services. This project contributes a missing coordination layer:
- publish wanted targets on-chain
- let hunters discover and pursue contracts
- let future Smart Gates consume bounty state as a routing or permit policy input
- let future Smart Turrets consume bounty state as a threat signal
- create the basis for security-as-a-service around player infrastructure

## Smart Gate narrative

The current slice maps cleanly to the Smart Gate mental model:
- bounty board = wanted registry
- wanted state = policy input
- Smart Gate policy object = configurable extension surface
- resulting behavior = `BLOCK`, `SURCHARGE`, or `ALERT_ONLY`

Recommended primary demo mode:
- `SURCHARGE`

Why:
- it is easy to explain in economic terms
- it shows that player-run infrastructure can monetize security and deterrence
- it avoids over-relying on a denial-only story

## How it maps to gameplay

- Bounty Board = player-run wanted registry
- KillProof / future kill-record flow = verifiable settlement bridge
- Smart Gate = bounty-aware access control and routing policy
- Smart Turret = bounty-aware defense and threat prioritization
- player infrastructure = bounty-backed deterrence, tolling, and security services

## What is live vs staged

Live / chain-backed now:
- publish bounties
- register hunters
- register a Smart Gate policy object
- read wanted state from chain-direct mode
- sign and execute transactions from a static-hosted frontend

Staged:
- real Smart Gate runtime hook inside the live game world
- real external kill-record provider
- trust-minimized verifier or attestor model
- automated Smart Turret world integration

## Why the current architecture is correct for this stage

- contracts are already live on testnet
- the frontend can be deployed statically without requiring a hosted indexer
- wallet transactions already follow the documented builder pattern of transaction builder + wallet hook + sign/execute
- the missing hard problem is no longer bounty publication, but world-event ingestion and native Smart Assembly hookup

## Demo framing

Recommended demo story:
1. open the chain-direct frontend with no custom backend dependency
2. show the Smart Gate demo page
3. show live wanted targets derived from current bounty state
4. select `SURCHARGE`
5. register the Smart Gate policy on-chain
6. explain the resulting gate behavior and how it maps to a future `canJump` hook
7. close by showing that Turret integration is the natural next slice

## Best next step after the hackathon

Wire the existing gate policy surface into a real Smart Gate extension / `canJump` hook path.
