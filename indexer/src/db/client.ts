import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const FALLBACK_SCHEMA = `
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
CREATE TABLE IF NOT EXISTS claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bounty_id TEXT NOT NULL,
  hunter TEXT NOT NULL,
  target TEXT NOT NULL,
  reward_amount INTEGER NOT NULL,
  kill_digest TEXT NOT NULL UNIQUE,
  solar_system_id INTEGER,
  claimed_at INTEGER NOT NULL,
  tx_digest TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS indexed_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  tx_digest TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS event_checkpoints (
  package_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  tx_digest TEXT NOT NULL,
  event_seq TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (package_id, event_type)
);
CREATE TABLE IF NOT EXISTS processed_chain_events (
  tx_digest TEXT NOT NULL,
  event_seq TEXT NOT NULL,
  event_type TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (tx_digest, event_seq)
);
`;

const resolveSchemaPath = (): string | null => {
  const candidates = [
    path.resolve(process.cwd(), 'src', 'db', 'schema.sql'),
    path.resolve(process.cwd(), 'dist', 'db', 'schema.sql'),
    path.resolve(path.dirname(new URL(import.meta.url).pathname), 'schema.sql'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
};

export const openDatabase = (dbPath: string): DatabaseSync => {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  const schemaPath = resolveSchemaPath();
  const schema = schemaPath ? fs.readFileSync(schemaPath, 'utf-8') : FALLBACK_SCHEMA;
  db.exec(schema);

  return db;
};
