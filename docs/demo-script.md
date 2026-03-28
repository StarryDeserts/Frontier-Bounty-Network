# Demo Script

## 1. One-time setup
1. `pnpm install`
2. `pnpm seed:data` (recommended for deterministic mock demo)

## 2. Contracts
1. `cd contracts/frontier_bounty`
2. `sui move build`
3. `sui move test`

## 3. Indexer
Mock mode:
1. `pnpm -C indexer dev:mock`
2. Verify `http://localhost:3001/health`

Live mode:
1. set `PACKAGE_ID`, `BOUNTY_BOARD_ID`, `CLAIM_REGISTRY_ID`
2. `pnpm -C indexer build`
3. `pnpm -C indexer start`
4. Verify `http://localhost:3001/api/bounties`

## 4. Frontend
1. `pnpm -C frontend dev`
2. Open `http://localhost:5173`

## 5. Core walkthrough
1. Dashboard: stats + feed.
2. Bounty Board: browse/filter list.
3. Bounty Detail: timeline + escrow details.
4. Hunter Ranking / My Profile: leaderboard and profile snapshot.
5. Live mode: `register_hunter` and `create_bounty` work on testnet.
6. Claim flow: use mock/demo path only.

## 6. API smoke test
- Run: `pnpm test:flow`
