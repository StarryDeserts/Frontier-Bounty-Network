CREATE TABLE IF NOT EXISTS bounties (
  id TEXT PRIMARY KEY,
  creator TEXT NOT NULL,
  target TEXT NOT NULL,
  reward_amount INTEGER NOT NULL,
  status INTEGER NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  claimed_by TEXT,
  claimed_at INTEGER,
  tx_digest TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bounties_target ON bounties (target);
CREATE INDEX IF NOT EXISTS idx_bounties_creator ON bounties (creator);
CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties (status);
CREATE INDEX IF NOT EXISTS idx_bounties_expires ON bounties (expires_at);

CREATE TABLE IF NOT EXISTS hunters (
  address TEXT PRIMARY KEY,
  badge_id TEXT,
  kills INTEGER NOT NULL DEFAULT 0,
  total_earnings INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  max_streak INTEGER NOT NULL DEFAULT 0,
  last_kill_at INTEGER,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hunters_rank ON hunters (total_earnings DESC, kills DESC);

CREATE TABLE IF NOT EXISTS claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bounty_id TEXT NOT NULL,
  hunter TEXT NOT NULL,
  target TEXT NOT NULL,
  reward_amount INTEGER NOT NULL,
  kill_digest TEXT NOT NULL UNIQUE,
  solar_system_id INTEGER,
  claimed_at INTEGER NOT NULL,
  tx_digest TEXT NOT NULL,
  FOREIGN KEY (bounty_id) REFERENCES bounties(id)
);

CREATE INDEX IF NOT EXISTS idx_claims_hunter ON claims (hunter);
CREATE INDEX IF NOT EXISTS idx_claims_claimed_at ON claims (claimed_at DESC);

CREATE TABLE IF NOT EXISTS indexed_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  tx_digest TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_indexed_events_created_at ON indexed_events (created_at DESC);

CREATE TABLE IF NOT EXISTS event_checkpoints (
  package_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  tx_digest TEXT NOT NULL,
  event_seq TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (package_id, event_type)
);

CREATE INDEX IF NOT EXISTS idx_event_checkpoints_updated_at ON event_checkpoints (updated_at DESC);

CREATE TABLE IF NOT EXISTS processed_chain_events (
  tx_digest TEXT NOT NULL,
  event_seq TEXT NOT NULL,
  event_type TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (tx_digest, event_seq)
);

CREATE INDEX IF NOT EXISTS idx_processed_chain_events_type ON processed_chain_events (event_type, created_at DESC);
