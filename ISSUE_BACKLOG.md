# ISSUE_BACKLOG

## P0 (Demo/Deploy blockers)

- None identified in this acceptance pass.

## P1 (Important, not demo-blocking)

- Tighten Move lint baseline:
  - remove duplicate alias imports
  - convert unnecessary `public entry` to a consistent style
  - scope `expected_failure` locations in tests.
- Split frontend production bundle to reduce >500kB chunk warning and improve first-load reliability on slow networks.
- Replace/abstract `node:sqlite` experimental runtime with a stable adapter (or keep adapter boundary and pin Node runtime policy explicitly).
- Add explicit API versioning/stability policy (`/api/events/recent` currently demo-support only).

## P2 (Enhancement)

- Add PostgreSQL adapter and migration parity with SQLite schema.
- Add optional Redis cache adapter for leaderboard/wanted list acceleration.
- Automate contract publish output parsing to generate env snippets (`PACKAGE_ID`, `BOUNTY_BOARD_ID`, `CLAIM_REGISTRY_ID`).
- Improve live-mode UX for object IDs (discover/select IDs instead of manual input).
- Add CI workflow for `pnpm typecheck`, `pnpm build`, `pnpm test:contracts`, and mock API smoke tests.
