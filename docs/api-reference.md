# API Reference

Base URL: `http://localhost:3001`

## Response envelope
- Success: `{ "data": ... }`
- Error: `{ "error": "..." }`

## Live ingestion note
- On-chain ingestion uses `queryEvents` HTTP polling against the configured Sui RPC URL.
- Polling state is persisted in SQLite tables `event_checkpoints` and `processed_chain_events`.
- `WS /ws/events` is the indexer-to-client push channel; it is not the chain subscription transport.
- `GET /api/events/recent` remains a demo-support endpoint, not a long-term external API guarantee.

## Health
- `GET /health`
- Response: `{ "ok": true }`

## Bounties
- `GET /api/bounties`
  - Query:
    - `status` (`0=ACTIVE`, `1=CLAIMED`, `2=CANCELLED`, `3=EXPIRED`)
    - `target` (address)
    - `creator` (address)
    - `page` (default `1`)
    - `pageSize` (default `20`, max `100`)
    - `sortBy` (`created_at` | `reward_amount` | `expires_at`)
    - `sortOrder` (`asc` | `desc`)
- `GET /api/bounties/:id`
- `GET /api/bounties/target/:address`
- `GET /api/bounties/creator/:address`

Bounty fields:
- `id`, `creator`, `target`, `rewardAmount`, `status`, `description`, `createdAt`, `expiresAt`, `claimedBy`, `claimedAt`, `txDigest`, `updatedAt`

## Hunters
- `GET /api/hunters/leaderboard`
  - Query: `limit` (default `100`, max `100`)
- `GET /api/hunters/:address`

Hunter fields:
- `address`, `badgeId`, `kills`, `totalEarnings`, `streak`, `maxStreak`, `rank`, `lastKillAt`

## Claims
- `GET /api/claims/recent`
  - Query: `limit` (default `20`, max `100`)

Claim fields:
- `id`, `bountyId`, `hunter`, `target`, `rewardAmount`, `killDigest`, `solarSystemId`, `claimedAt`, `txDigest`

## Claim proof resolution
- `POST /api/claim-proof/resolve`
- Request body:
  - `{ "bountyId": "0x...", "hunter": "0x..." }`

Response fields:
- `status`: `disabled` | `provider_unconfigured` | `not_found` | `ready`
- `provider`: `disabled` | `mock` | `frontier`
- `bounty`: `{ id, target, createdAt, expiresAt } | null`
- `proofDraft?`: `{ killer, victim, timestampMs, solarSystemId, killDigestHex }`
- `issuance?`:
  - `mode`: `manual`
  - `moveCall`: `{ packageId, module, function, target, args, gasBudget }`
  - `powershellCommand`: copyable CLI template for `sui client call`
- `notes`: `string[]`

Behavior notes:
- `provider=disabled` is the default and returns `status=disabled`.
- `provider=mock` returns deterministic proof drafts for local testing and controlled operator demos.
- `provider=frontier` is currently a compiled stub. Without `FRONTIER_KILL_API_BASE_URL`, it returns `status=provider_unconfigured`.
- This endpoint does not execute a claim. It only resolves proof input and returns a manual issuance plan.

## Stats
- `GET /api/stats`

Stats fields:
- `activeBounties`, `totalBounties`, `totalRewardsPaid`, `totalClaims`, `wantedTargets`, `topHunter`, `topReward`

## Events (demo-support endpoint)
- `GET /api/events/recent`
  - Query: `limit` (default `30`, max `100`)

Indexed event fields:
- `id`, `eventType`, `txDigest`, `payload`, `createdAt`

## WebSocket
- `WS /ws/events`
- Pushes JSON event envelope: `{ type, txDigest, payload, timestampMs }`
- First message on connect is `system.connected`.
