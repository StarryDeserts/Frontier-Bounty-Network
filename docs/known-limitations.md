# Known Limitations

## Builder stack

- the frontend remains on `@mysten/dapp-kit`, not `@evefrontier/dapp-kit`.
- this is intentional for the current static-hosted, assembly-agnostic MVP.
- EV Vault is recommended and should work via Wallet Standard, but the app is not yet an EVE Frontier SDK-native assembly console.

## GraphQL and assembly-native reads

- current direct reads use `SuiClient` object and event queries rather than EVE Frontier GraphQL assembly helpers.
- this is sufficient for the current bounty board UX, but not yet the richest builder-native read path.
- no `tenant + itemId` assembly routing is implemented.

## Claim trust boundary

- `KillProofIssuerCap` is still a centralized trust point.
- proof issuance is manual and operator-controlled.
- claim is therefore not trust-minimized or production-grade in a decentralized sense.

## External provider

- the frontier kill-record provider is still a compiled stub.
- the repo does not yet integrate a real external kill-record source.
- claim remains `live-ready but awaiting external provider`, not fully live.

## Smart Gate and Smart Turret integration

- `gate_bounty` and `turret_bounty` are present as contract extension surfaces, but they are not yet connected to live EVE Frontier world callbacks.
- there is no live `canJump` integration yet.
- there is no live Smart Turret target-priority integration yet.

## Indexerless ranking and history

- without an indexer, ranking, recent claims, and activity feeds are derived from recent on-chain event windows.
- these views are intentionally simplified for static-hosted operation and demo resilience.
- they should not be treated as complete historical analytics.

## Indexer transport

- public testnet websocket subscribe was unreliable for this project path.
- the indexer therefore uses HTTP `queryEvents` polling instead of chain websocket subscribe.

## SQLite runtime

- local MVP uses `node:sqlite`.
- Node currently marks it as experimental.
- this is acceptable for local demo and handoff, but it is not the final persistence story.

## Frontend static hosting requirements

- the app still requires SPA fallback routing to `index.html` on the static host.
- the frontend can run without indexer, but routing is still client-side.

## Frontend bundle

- frontend build still emits a large chunk warning.
- this does not block demo or static deployment, but it remains technical debt.

## Manual issuance workflow

- operator-assisted proof issuance requires the issuer-cap holder to run a manual command.
- this is acceptable for controlled demos, but it is not the intended long-term UX.
