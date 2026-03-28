# Claim Live Plan

Date: 2026-03-27
Status target for this round: `live-ready but awaiting external provider`

## Current blocker

Before Route B, `claim_bounty` already had a sound validation path but no production way to mint the required `KillProof` object. The only constructors were `#[test_only]`, so a provider-only adapter could not close the gap.

## Why Route A was not enough

Route A would only add an adapter that translates external kill records into a format the repo understands. That is not sufficient here because the chain still needs a production minting boundary for `KillProof`.

Without a production issuance entry point:
- the adapter can discover data
- the indexer can prepare inputs
- but no production actor can legally create the `KillProof` consumed by `claim_bounty`

That is why this round chose Route B.

## Route B implemented in this round

Contract changes:
- added `KillProofIssuerCap has key, store`
- added `KillProofIssuedEvent`
- added production `issue_kill_proof(...)`
- added explicit `recipient == killer` check via `E_RECIPIENT_KILLER_MISMATCH`
- kept `bounty_verify::claim_bounty` ABI and core validation logic unchanged

Indexer changes:
- added claim adapter boundary under `indexer/src/claim/`
- added provider modes `disabled | mock | frontier`
- added issuer mode `manual`
- added `POST /api/claim-proof/resolve`
- manual issuer now returns both a structured Move call and a copyable PowerShell command

## What `claim_bounty` actually validates today

Current claim acceptance depends on these proof-bound facts:
- `kill_proof.victim == bounty.target`
- `kill_proof.killer == tx sender`
- sender is not the victim
- sender is not the bounty creator
- `kill_digest` has not been seen before in `ClaimRegistry`

Fields carried in `KillProof` but not yet enforced by on-chain acceptance checks:
- `timestamp`
- `solar_system_id`

These fields are still kept because they are needed for a future real-provider model, off-chain auditability, and event attribution.

## Production `KillProof` data model

Current minimum production-safe field set:
- `killer: address`
- `victim: address`
- `timestamp: u64`
- `solar_system_id: u64`
- `kill_digest: vector<u8>`

Why this set is sufficient for now:
- `killer`, `victim`, and `kill_digest` are directly relevant to claim safety and replay protection
- `timestamp` and `solar_system_id` preserve provider context without weakening current validation
- no `#[test_only]` constructor was exposed to production callers

## External provider requirements

A real external kill-record provider must at minimum return:
- killer address
- victim address
- kill timestamp in milliseconds
- solar system identifier
- canonical kill digest bytes or a stable hash that the issuer and claim registry can treat as the replay key

Optional future fields that may later justify on-chain checks or richer audit trails:
- provider record id
- battle or encounter id
- attestor signature bundle
- fleet or ship metadata

## Current Trust Boundary

`KillProofIssuerCap` is a temporary centralized trust point.

Current holder:
- the package publisher receives the cap at publish time by default

Current issuance model:
- manual and operator-controlled
- no default backend hot signer
- not yet a decentralized verifier or trust-minimized attestor design

Impact if the cap is lost, leaked, or misused:
- bogus `KillProof` objects can be minted
- invalid claims could pass because `claim_bounty` trusts the consumed `KillProof`
- the claim registry would still stop replay of the same digest, but it would not stop a malicious issuer from inventing new bogus digests

Planned migration path:
1. replace manual issuance with a dedicated verifier service that checks a real external kill source
2. move cap control to multisig or a hardened operator key path
3. optionally split issuance from attestation so the chain accepts provider-signed payloads verified by a trusted attestor set
4. once stable, consider evolving from centralized cap ownership toward a more formal verifier or external attestor model

## What is implemented now

On-chain:
- production `KillProof` issuance boundary exists
- `KillProofIssuedEvent` gives indexer and operator visibility into issuance
- Route B package is published to testnet and documented as canonical

Off-chain:
- `mock` provider returns deterministic proof drafts for local testing and operator demos
- `frontier` provider exists as a compiled stub with explicit unconfigured/TODO states
- manual issuer returns a complete PowerShell `sui client call` template
- resolve API exposes the proof draft plus issuance plan

## What still depends on an external provider

Not done in this round:
- live lookup of real kill records from the game-side source
- production verification that the resolved record is authentic before issuance
- automated claim flow driven by a real provider instead of operator intervention

That is why the project state is now:
- `live-ready but awaiting external provider`

## Shortest path to true live claim

1. Implement the `frontier` provider against the real kill-record API.
2. Define the canonical digest derivation used by both provider and issuer.
3. Run the verifier under a controlled signer or multisig that holds `KillProofIssuerCap`.
4. Add operator or service-side observability around `KillProofIssuedEvent` and claim success/failure.
5. Only after the real provider is validated should the public demo path include automated live claim.
