import { openDatabase } from '../db/client.js';
import { config } from '../config.js';
import { IndexerRepository } from '../db/repository.js';
import { EventBus } from '../event-bus.js';
import { ingestMockEvents } from '../event-listener.js';

const db = openDatabase(config.dbPath);
const repo = new IndexerRepository(db);
const bus = new EventBus();

ingestMockEvents(config.packageId, repo, bus);

console.log(`[db:seed] seeded mock events into ${config.dbPath}`);
db.close();
