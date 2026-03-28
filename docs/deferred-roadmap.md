# Deferred Roadmap

## P1: next round priority

- integrate the real EVE Frontier kill-record provider and replace the current stub
- define and freeze the canonical kill digest derivation rule
- move `KillProofIssuerCap` control to a safer signer or multisig path
- choose a dedicated verifier service path for kill-record validation before issuance
- add observability around `KillProofIssuedEvent`, claim failures, and indexer sync health

## P2: medium-term enhancements

- adopt GraphQL-backed assembly or indexed reads where EVE Frontier-specific object transforms clearly improve the UX
- evaluate `@evefrontier/dapp-kit` migration once sponsored transactions, assembly helpers, or EV Vault-native flows become product-critical
- add richer Smart Gate and Smart Turret operator tooling around bounty-aware policy simulation
- improve operator workflows for proof resolution and issuance
- reduce frontend bundle size through code-splitting and dependency trimming
- evaluate a PostgreSQL-backed persistence option for hosted environments

## P3: longer-term optimization

- connect `gate_bounty` to live `canJump` world-policy flows
- connect `turret_bounty` to live Smart Turret threat-priority callbacks
- harden the verifier / attestor model beyond manual issuance
- revisit websocket or alternative low-latency ingest once public infrastructure is reliable
- clean up Move lint warnings and tighten expected-failure annotations
- add deeper analytics, audit trails, and production deployment automation
