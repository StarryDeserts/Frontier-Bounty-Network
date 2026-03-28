import path from 'node:path';

import { config as loadEnv } from 'dotenv';
import { getFullnodeUrl } from '@mysten/sui/client';

loadEnv();

const resolveDbPath = (): string => {
  const envPath = process.env.DB_PATH;
  if (envPath && envPath.trim().length > 0) {
    return path.resolve(process.cwd(), envPath);
  }
  return path.resolve(process.cwd(), 'data', 'indexer.sqlite');
};

const toBool = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
};

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toProvider = (value: string | undefined): 'disabled' | 'mock' | 'frontier' => {
  if (value === 'mock' || value === 'frontier') {
    return value;
  }
  return 'disabled';
};

const toIssuerMode = (value: string | undefined): 'manual' => {
  if (value === 'manual') {
    return value;
  }
  return 'manual';
};

const optionalString = (value: string | undefined): string | null => {
  if (!value || value.trim().length === 0) {
    return null;
  }
  return value.trim();
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: toNumber(process.env.PORT, 3001),
  dbPath: resolveDbPath(),
  suiRpcUrl: process.env.SUI_RPC_URL ?? getFullnodeUrl('testnet'),
  packageId: process.env.PACKAGE_ID ?? '0x0',
  bountyBoardId: process.env.BOUNTY_BOARD_ID ?? '0x0',
  claimRegistryId: process.env.CLAIM_REGISTRY_ID ?? '0x0',
  killProofIssuerCapId: optionalString(process.env.KILL_PROOF_ISSUER_CAP_ID),
  enableEventListener: toBool(process.env.ENABLE_EVENT_LISTENER, true),
  useMockEvents: toBool(process.env.USE_MOCK_EVENTS, false),
  seedMockOnStart: toBool(process.env.MOCK_SEED_ON_START, true),
  forceFullBackfill: toBool(process.env.FORCE_FULL_BACKFILL, false),
  eventPollIntervalMs: toNumber(process.env.EVENT_POLL_INTERVAL_MS, 4000),
  claimProofProvider: toProvider(process.env.CLAIM_PROOF_PROVIDER),
  claimProofIssuerMode: toIssuerMode(process.env.CLAIM_PROOF_ISSUER_MODE),
  frontierKillApiBaseUrl: optionalString(process.env.FRONTIER_KILL_API_BASE_URL),
  wsEnabled: toBool(process.env.WS_ENABLED, true),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
};
