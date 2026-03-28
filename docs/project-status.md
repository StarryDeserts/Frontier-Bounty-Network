# Project Status

Status: submission-ready
Date: 2026-03-28

## Current status

Frontier Bounty Network is ready to submit as a Sui x EVE Frontier hackathon project.

The repository is no longer being positioned as a generic bounty MVP.
Its primary judge-facing slice is now:
- Smart Gate x Bounty
- wanted players trigger Smart Gate policy

## Live today

Live and chain-backed now:
- Sui testnet package published and frozen as the current baseline
- hunter registration
- bounty creation
- production proof issuance boundary
- Smart Gate policy registration surface
- static frontend with direct chain reads
- optional indexer enhancement path

## Demo today

Best current demo:
- open `/smart-gate-demo`
- show wanted state from live bounty data
- select `SURCHARGE`
- register a gate policy on-chain
- explain how this becomes a future Smart Gate runtime behavior

## Known limitations

Most important limitations for judges and reviewers:
- Smart Gate runtime integration is not connected yet
- claim remains operator-assisted because the real kill-record provider is not integrated
- the current proof issuer cap is still a centralized trust point

## Deferred roadmap

Most important deferred items:
- real Smart Gate extension hookup
- real kill-record provider and verifier flow
- safer trust boundary for proof issuance

See also:
- `docs/deferred-roadmap.md`

## What is intentionally not fully implemented yet

Intentionally left staged for submission scope:
- live game-side Smart Gate hook
- live Smart Turret hookup
- automated kill-record verification
- trust-minimized verifier or attestor path

Reason:
- the project already demonstrates the policy surface and live on-chain state
- the remaining work is integration and trust-hardening, not proof that the core concept works
