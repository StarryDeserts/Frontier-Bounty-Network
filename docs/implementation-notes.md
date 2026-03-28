# Implementation Notes

This file records deliberate changes made to keep the architecture intent while delivering a compilable, runnable MVP.

## 1. Move shared-object testing helpers
- Document intent: `BountyBoard` and `ClaimRegistry` are shared objects.
- Adjustment: added `#[test_only]` helpers:
  - `bounty_registry::share_board_for_testing`
  - `bounty_verify::share_claim_registry_for_testing`
- Reason: `transfer::share_object` is private to the defining module; external test modules cannot call it directly.

## 2. On-chain target reward aggregation
- Document showed target index only (`Table<address, vector<ID>>`).
- Adjustment: added `target_total_active_reward: Table<address, u64>` to `BountyBoard`.
- Reason: supports O(1) threshold checks in `turret_bounty::should_engage` and `gate_bounty::check_jump_permission` without iterating dynamic object graph.

## 3. Escrow integration boundary
- Document pseudo-code passed full `Bounty` into escrow and accessed internals cross-module.
- Adjustment: escrow module now operates on `&mut UID` parent references (`deposit_with_parent`, `release_to_hunter`, `refund_to_depositor`), and registry exposes package-level wrappers.
- Reason: Move field privacy and acyclic module dependency requirements.

## 4. Claim event handling
- Document event examples were mixed (`BountyClaimedEvent` and `BountyVerifiedEvent`).
- Adjustment: contract emits both events; indexer treats `BountyVerifiedEvent` as authoritative for claim record insertion and hunter stat accumulation.
- Reason: preserves traceability while avoiding ambiguous reward accounting.

## 5. Frontend wallet kit package
- Document stack named `@mysten/dapp-kit-react`.
- Adjustment: used official current package `@mysten/dapp-kit`.
- Reason: ecosystem package naming/version reality; preserves the same provider/hook model.

## 6. Indexer database engine
- Document allowed PostgreSQL/SQLite and optional Redis.
- Adjustment: local MVP uses SQLite via Node built-in `node:sqlite`.
- Reason: avoids native module build friction and keeps zero-extra-service local startup. Repository boundaries are retained so PostgreSQL/Redis adapters can be added later.

## 7. Mock data path for unavailable external integrations
- Document mentions optional real EVE/chain integrations.
- Adjustment:
  - indexer supports `USE_MOCK_EVENTS=true`
  - `scripts/seed-data.mjs` and `indexer/src/mock/mock-events.ts` provide deterministic local data
- Reason: ensures local demo/test when real killproof/event feeds are unavailable.

## 8. Turret/Gate behavior granularity
- Document pseudo-code left bounty amount lookup simplified.
- Adjustment: threshold logic is implemented against aggregated target active reward and emits configured events.
- Reason: keeps extension modules functional in MVP while staying decoupled from game-side hooks.

## 9. Expected-failure tests
- Two failure tests use explicit abort-code values without location scoping warning.
- Reason: tests still pass and validate failure path behavior; can be tightened later by adding location-qualified constants.

## 10. API contract scope
- Core REST contract for external consumers is:
  - `/api/bounties*`, `/api/hunters*`, `/api/claims/recent`, `/api/stats`.
- `GET /api/events/recent` is kept for dashboard live-feed bootstrap and demo tooling, and is treated as a non-contract endpoint.
- `GET /health` currently returns `{ ok: true }`.
- Reason: keeps demo UX smooth while minimizing hard API guarantees before a formal versioned API release.

## 11. Live indexer ingestion transport
- Original architecture favored event-driven chain ingestion and the first implementation used `subscribeEvent`.
- Adjustment: live testnet ingestion now uses `queryEvents` HTTP polling with per-event-type cursors and startup backfill.
- Reason: the public testnet websocket subscribe path returned HTTP `405` during acceptance, which blocked live mode entirely. Polling keeps the event-driven API surface while using the currently reliable transport.

## 12. Indexer env surface for deployment parity
- Adjustment: indexer config now parses `BOUNTY_BOARD_ID`, `CLAIM_REGISTRY_ID`, and `EVENT_POLL_INTERVAL_MS` in addition to `PACKAGE_ID`.
- Reason: keeps deployment metadata aligned across root env, frontend env, and hosted indexer configuration, even though the live listener currently only needs `PACKAGE_ID` + RPC URL for ingestion.

## 13. Persistent checkpoints and transactional event dedupe
- Adjustment: SQLite now persists polling state in `event_checkpoints` and dedupe markers in `processed_chain_events`.
- Adjustment: each event is processed inside one DB transaction:
  1. mark processed
  2. skip if duplicate
  3. apply domain projection writes
  4. append indexed event log
  5. update checkpoint
  6. commit
- Adjustment: added `FORCE_FULL_BACKFILL`, `sync:reset`, `sync:rebuild`, and `checkpoint:smoke`.
- Reason: avoids full replay on every restart while preserving idempotence and a clean rebuild path for demos and repair operations.

## 14. Route B production proof issuance boundary
- Original MVP state: `claim_bounty` required a `KillProof`, but only `#[test_only]` constructors existed.
- Adjustment: `bounty_verify` now includes:
  - `KillProofIssuerCap`
  - `KillProofIssuedEvent`
  - production `issue_kill_proof(...)`
  - explicit `recipient == killer` check with `E_RECIPIENT_KILLER_MISMATCH`
- The `claim_bounty` ABI and core validation logic remain unchanged.
- Reason: an adapter-only approach could not solve the absence of a production minting boundary for `KillProof`.

## 15. Current claim trust boundary
- Current state: `KillProofIssuerCap` is a temporary centralized trust point held by the package publisher by default.
- Issuance mode: manual and operator-controlled; no backend hot signer is enabled by default.
- Risk: cap loss, leakage, or mis-issuance would allow bogus `KillProof` minting and therefore invalid claims.
- Planned migration: move toward a dedicated verifier, multisig-controlled issuer, or external attestor-backed issuance flow.

## 16. Proof data model scope
- Current on-chain claim validation actually depends on:
  - `kill_proof.victim == bounty.target`
  - `kill_proof.killer == tx sender`
  - sender is not the victim
  - sender is not the bounty creator
  - `kill_digest` has not been used before
- `timestamp` and `solar_system_id` are preserved in `KillProof` and emitted in events, but are not yet part of on-chain acceptance checks.
- Reason: this is the minimum production-safe object shape that preserves replay protection and future external-provider compatibility without weakening the current claim path.

## 17. Frontend dual read path
- Original frontend assumption: indexer API is the only read path for dashboard, board, ranking, profile, and recent activity.
- Adjustment: frontend now supports `indexer` and `chain-direct` modes with `VITE_DATA_MODE=auto|indexer|chain-direct`.
- Adjustment: `chain-direct` uses official `@mysten/sui` RPC reads against the canonical Route B package:
  - `getObject()` for `BountyBoard` and `ClaimRegistry`
  - `getOwnedObjects()` for `HunterBadge`
  - `queryEvents()` for recent bounty and hunter activity
- Reason: the user wanted a judge-facing static site that remains interactive without a continuously hosted indexer.

## 18. Direct-chain ranking and history scope
- Adjustment: in `chain-direct` mode, leaderboard, recent claims, and live feed are intentionally simplified.
- Current behavior: these views are derived from recent event windows and directly readable shared-object counters rather than full historical projection tables.
- Reason: preserves demo resilience and static-hosting viability without inventing a new backend service.
