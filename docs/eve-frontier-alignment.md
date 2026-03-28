# EVE Frontier Alignment

Date: 2026-03-28
Status: alignment pass completed for the frozen Route B baseline

## Project framing

The correct framing for this repository is:

> An EVE Frontier bounty infrastructure dApp built on Sui, designed to plug into Smart Assemblies, Smart Gates, Smart Turrets, and future kill-record flows.

This is not just a generic Sui bounty board. In Frontier terms, it is infrastructure:
- a wanted registry
- a deterrence and security coordination layer
- a future bridge between world events and on-chain reward settlement
- a building block for player-run services around transport, defense, and access control

## Alignment with official builder docs

Primary references from the official docs:
- external browser dApps use Sui Wallet Standard and currently support EVE Vault as the wallet path
- EVE Frontier dApp kit layers wallet UX, GraphQL assembly reads, and sponsored transaction helpers on top of the Sui stack
- the world read path is explicitly split into GraphQL, gRPC, events, and direct `SuiClient` reads
- Smart Infrastructure is centered on programmable Smart Assemblies such as gates, turrets, and storage

## Current frontend alignment

What the repo does today:
- wallet/provider: `@mysten/dapp-kit` `SuiClientProvider` + `WalletProvider`
- account access: `useCurrentAccount`
- transaction execution: `useSignAndExecuteTransaction`
- direct reads: `SuiClient.getObject`, `getOwnedObjects`, `queryEvents`
- enhanced reads: optional indexer for projections and claim-resolution UX

What already aligns well:
- the write path matches the official builder pattern of transaction builder + wallet hook + sign/execute
- the read path already uses one of the official world-read strategies: `SuiClient`
- the app is compatible with Wallet Standard, which is the same discovery model documented for external browser dApps

What is still not EVE Frontier-native enough:
- not using `EveFrontierProvider`
- not using EVE Frontier GraphQL helper utilities
- not assembly-centric around `tenant` and `itemId`
- not using sponsored transaction flows

## EV Vault position

Current recommendation:
- EVE Frontier players should use EV Vault
- the UI now states this explicitly
- the project keeps the current Mysten stack because EV Vault guidance and Wallet Standard compatibility are enough for the current demo scope

Why not migrate immediately:
- the current product is not yet centered on a specific assembly object model
- static-hosting and low integration risk are higher priority than stack branding
- there is no immediate requirement for sponsored transactions or EVE Frontier assembly GraphQL transforms
- the official EVE Frontier dApp kit itself still builds on the underlying Sui transaction model, so the current stack is not architecturally divergent

Migration trigger:
- migrate when the app becomes assembly-native, needs EVE Frontier data transforms, or must rely on sponsored transactions and EV Vault-first UX as core product requirements

## Gameplay mapping

### Bounty Board

Maps to:
- player-issued wanted contracts
- local order / deterrence infrastructure
- security services for alliances, bases, routes, and economic hubs

### KillProof and kill records

Maps to:
- a future bridge from EVE Frontier kill records or killmails into on-chain reward settlement
- off-chain verification + on-chain issuance + on-chain claim settlement

Current boundary:
- `ClaimProofProvider`
- `EveFrontierKillRecordProvider` stub
- manual issuer + `KillProofIssuerCap`

### Smart Gate

Maps to:
- bounty-aware access control
- route denial or surcharge logic around future `canJump` decisions
- threat-aware routing for player infrastructure

Current boundary:
- `gate_bounty` contract module
- frontend registration transaction builder
- policy integration remains staged, not live

### Smart Turret

Maps to:
- bounty-aware targeting and prioritization
- automated defense around bases, grids, and owned infrastructure
- programmable escalation based on wanted status or active reward thresholds

Current boundary:
- `turret_bounty` contract module
- frontend registration transaction builder
- threat integration remains staged, not live

### Smart Storage and service economy

Maps to:
- player-run security marketplaces
- route security subscriptions
- bounty-backed deterrence around infrastructure nodes
- future integrations with storage, logistics, and industrial hubs

## Architecture answers

### 1. Which EVE Frontier layer is the best fit today?

Best answer:
- all of the above, but in staged progression

More precisely:
- today the strongest fit is the builder frontend layer plus indexed gameplay data layer
- next comes the claim verification service layer
- after that comes the Smart Assembly policy layer for gates and turrets

### 2. Should the project migrate to the official EF React SDK now?

No, not immediately.

Why not now:
- current scope is static-hosted, assembly-agnostic, and operator-demo friendly
- the existing stack already matches the documented write path and Wallet Standard model
- immediate migration would add churn without unlocking a core blocked feature

When migration becomes justified:
- when the product is centered on a live assembly object
- when GraphQL assembly helpers materially simplify the read path
- when sponsored transactions are required
- when EV Vault-first UX becomes a hard product requirement rather than a recommendation

### 3. Where should the future kill-record integration point live?

Recommended architecture:
- indexer/service layer first
- dedicated verifier service next
- on-chain issuer remains the final controlled issuance boundary

Why:
- frontend should not be trusted with kill-record verification
- the verification and normalization logic belongs off-chain where provider APIs and signatures can be handled safely
- on-chain should receive only the minimal proof issuance action after verification is complete

### 4. What is the shortest Smart Gate / Smart Turret integration route?

Stage 1:
- keep current contract modules as policy surfaces
- define the off-chain adapters that produce gate or turret policy inputs

Stage 2:
- feed real EVE Frontier world events into those adapters
- simulate decisions off-chain against bounty state

Stage 3:
- connect the validated policy decisions to live `canJump` and turret-priority extension flows

Stage 4:
- harden observability, failure handling, and operator tooling

## Current claim status

The correct label remains:
- `live-ready but awaiting external provider`

This means:
- on-chain issuance boundary exists
- manual operator issuance exists
- the missing piece is the real EVE Frontier kill-record provider and verifier path
