import { SuiClient } from '@mysten/sui/client';

import { ManualProofIssuer } from './claim/issuer.js';
import { createClaimProofProvider } from './claim/provider-factory.js';
import { ClaimProofService } from './claim/service.js';
import { ApiServer } from './api/server.js';
import { config } from './config.js';
import { openDatabase } from './db/client.js';
import { IndexerRepository } from './db/repository.js';
import { EventBus } from './event-bus.js';
import { ingestMockEvents, IndexerEventListener } from './event-listener.js';

const db = openDatabase(config.dbPath);
const repo = new IndexerRepository(db);
const bus = new EventBus();
const claimProofProvider = createClaimProofProvider();
const claimProofIssuer = new ManualProofIssuer();
const claimProofService = new ClaimProofService(repo, claimProofProvider, claimProofIssuer);

const apiServer = new ApiServer(repo, bus, claimProofService, {
  port: config.port,
  corsOrigin: config.corsOrigin,
  wsEnabled: config.wsEnabled,
});

let listener: IndexerEventListener | null = null;

const start = async (): Promise<void> => {
  if (config.useMockEvents && config.seedMockOnStart) {
    ingestMockEvents(config.packageId, repo, bus);
    console.log('[indexer] mock events seeded');
  }

  await apiServer.start();
  console.log(`[indexer] API ready on http://localhost:${config.port}`);

  if (config.enableEventListener && !config.useMockEvents) {
    if (config.packageId === '0x0') {
      console.warn('[indexer] PACKAGE_ID is 0x0, skipping chain listener');
    } else {
      const client = new SuiClient({ url: config.suiRpcUrl });
      listener = new IndexerEventListener(client, config.packageId, repo, bus, {
        pollIntervalMs: config.eventPollIntervalMs,
        forceFullBackfill: config.forceFullBackfill,
      });
      await listener.start();
      console.log('[indexer] chain listener started');
    }
  }
};

const shutdown = async (): Promise<void> => {
  console.log('\n[indexer] shutting down...');
  await listener?.stop();
  await apiServer.stop();
  db.close();
};

process.on('SIGINT', () => {
  shutdown()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
});

process.on('SIGTERM', () => {
  shutdown()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
});

start().catch(async (error) => {
  console.error('[indexer] startup failed', error);
  await shutdown();
  process.exit(1);
});
