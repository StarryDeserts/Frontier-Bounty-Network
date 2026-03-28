import { config } from '../config.js';
import { openDatabase } from '../db/client.js';
import { IndexerRepository } from '../db/repository.js';

const rebuild = process.argv.includes('--rebuild');

const db = openDatabase(config.dbPath);
const repo = new IndexerRepository(db);

repo.resetSyncState({ rebuild });
console.log(
  rebuild
    ? `[sync:reset] rebuilt projections and sync state at ${config.dbPath}`
    : `[sync:reset] cleared event checkpoints at ${config.dbPath}`,
);

db.close();
