import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import type { SuiClient } from '@mysten/sui/client';

import { EventBus } from '../event-bus.js';
import { IndexerEventListener } from '../event-listener.js';
import { createMockEvents } from '../mock/mock-events.js';
import { processMoveEvent } from '../processors/index.js';
import { openDatabase } from '../db/client.js';
import { IndexerRepository } from '../db/repository.js';
import type { EventCursor } from '../types.js';

const dbPath = path.resolve(process.cwd(), 'data', 'checkpoint-smoke.sqlite');
const packageId = '0xcheckpointsmoke';
const events = createMockEvents(packageId);

const deleteIfExists = (targetPath: string): void => {
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
  }
};

const cleanupDbFiles = (): void => {
  deleteIfExists(dbPath);
  deleteIfExists(`${dbPath}-shm`);
  deleteIfExists(`${dbPath}-wal`);
};

const readCounts = (repo: IndexerRepository): Record<string, number> => {
  const stats = repo.getStats();
  return {
    bounties: repo.listBounties({ pageSize: 100 }).length,
    hunters: repo.getLeaderboard(100).length,
    claims: repo.getRecentClaims(100).length,
    indexedEvents: repo.getRecentEvents(100).length,
    activeBounties: stats.activeBounties,
    totalClaims: stats.totalClaims,
  };
};

const readTableCounts = (dbPathValue: string): Record<string, number> => {
  const db = openDatabase(dbPathValue);
  const tables = [
    'event_checkpoints',
    'processed_chain_events',
    'bounties',
    'hunters',
    'claims',
    'indexed_events',
  ] as const;

  const counts = Object.fromEntries(
    tables.map((table) => {
      const row = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number };
      return [table, Number(row.count ?? 0)];
    }),
  ) as Record<string, number>;

  db.close();
  return counts;
};

const checkpointFor = (dbPathValue: string, eventType: string): EventCursor | null => {
  const db = openDatabase(dbPathValue);
  const repo = new IndexerRepository(db);
  const checkpoint = repo.getEventCheckpoint(packageId, eventType);
  db.close();

  if (!checkpoint) {
    return null;
  }

  return {
    txDigest: checkpoint.txDigest,
    eventSeq: checkpoint.eventSeq,
  };
};

const seedEvents = (dbPathValue: string): Record<string, number> => {
  const db = openDatabase(dbPathValue);
  const repo = new IndexerRepository(db);
  const bus = new EventBus();

  for (const event of events) {
    processMoveEvent(event, repo, bus);
  }

  const counts = readCounts(repo);
  db.close();
  return counts;
};

const assertCounts = (actual: Record<string, number>, label: string): void => {
  assert.deepEqual(actual, {
    bounties: 2,
    hunters: 1,
    claims: 1,
    indexedEvents: 5,
    activeBounties: 0,
    totalClaims: 1,
  }, label);
};

const assertTableCounts = (actual: Record<string, number>, expected: Record<string, number>, label: string): void => {
  for (const [key, value] of Object.entries(expected)) {
    assert.equal(actual[key], value, `${label}: unexpected ${key}`);
  }
};

const assertListenerResumesFromCheckpoint = async (forceFullBackfill: boolean): Promise<void> => {
  const calls: Array<{ type: string; cursor: EventCursor | null }> = [];
  const client = {
    queryEvents: async (params: { query: { MoveEventType: string }; cursor: EventCursor | null }) => {
      calls.push({ type: params.query.MoveEventType, cursor: params.cursor });
      return {
        data: [],
        hasNextPage: false,
        nextCursor: params.cursor,
      };
    },
  } as unknown as SuiClient;

  const db = openDatabase(dbPath);
  const repo = new IndexerRepository(db);
  const bus = new EventBus();
  const listener = new IndexerEventListener(client, packageId, repo, bus, {
    pollIntervalMs: 60_000,
    forceFullBackfill,
  });

  await listener.start();
  await listener.stop();
  db.close();

  assert.equal(calls.length, 7, 'listener should query all tracked streams');
  for (const call of calls) {
    const savedCheckpoint = checkpointFor(dbPath, call.type);
    if (forceFullBackfill) {
      assert.equal(call.cursor, null, `expected full backfill cursor for ${call.type}`);
    } else {
      assert.deepEqual(call.cursor, savedCheckpoint, `expected saved checkpoint for ${call.type}`);
    }
  }
};

cleanupDbFiles();

const baseline = seedEvents(dbPath);
assertCounts(baseline, 'baseline seed');
assertTableCounts(readTableCounts(dbPath), {
  event_checkpoints: 4,
  processed_chain_events: 5,
  bounties: 2,
  hunters: 1,
  claims: 1,
  indexed_events: 5,
}, 'baseline table counts');

const afterReplay = seedEvents(dbPath);
assertCounts(afterReplay, 'duplicate replay should be idempotent');
assertTableCounts(readTableCounts(dbPath), {
  event_checkpoints: 4,
  processed_chain_events: 5,
  bounties: 2,
  hunters: 1,
  claims: 1,
  indexed_events: 5,
}, 'duplicate replay table counts');

await assertListenerResumesFromCheckpoint(false);
await assertListenerResumesFromCheckpoint(true);

{
  const db = openDatabase(dbPath);
  const repo = new IndexerRepository(db);
  repo.resetSyncState();
  db.close();
}
assertTableCounts(readTableCounts(dbPath), {
  event_checkpoints: 0,
  processed_chain_events: 5,
  bounties: 2,
  hunters: 1,
  claims: 1,
  indexed_events: 5,
}, 'checkpoint-only reset');

const afterCheckpointResetReplay = seedEvents(dbPath);
assertCounts(afterCheckpointResetReplay, 'checkpoint-only reset replay should remain idempotent');
assertTableCounts(readTableCounts(dbPath), {
  event_checkpoints: 4,
  processed_chain_events: 5,
  bounties: 2,
  hunters: 1,
  claims: 1,
  indexed_events: 5,
}, 'checkpoint-only reset replay table counts');

{
  const db = openDatabase(dbPath);
  const repo = new IndexerRepository(db);
  repo.resetSyncState({ rebuild: true });
  db.close();
}
assertTableCounts(readTableCounts(dbPath), {
  event_checkpoints: 0,
  processed_chain_events: 0,
  bounties: 0,
  hunters: 0,
  claims: 0,
  indexed_events: 0,
}, 'rebuild reset');

const rebuilt = seedEvents(dbPath);
assertCounts(rebuilt, 'rebuild replay should restore projections');
assertTableCounts(readTableCounts(dbPath), {
  event_checkpoints: 4,
  processed_chain_events: 5,
  bounties: 2,
  hunters: 1,
  claims: 1,
  indexed_events: 5,
}, 'rebuild replay table counts');

console.log('[checkpoint:smoke] all assertions passed');
