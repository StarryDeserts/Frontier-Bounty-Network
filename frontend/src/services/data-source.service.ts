import {
  DATA_MODE,
  INDEXER_API_URL,
  INDEXER_HEALTH_TIMEOUT_MS,
} from '@/config/constants';
import type { DataSourceStatus } from '@/types/data-source';

const MODE_CACHE_TTL_MS = 30_000;

class DataSourceService {
  private cachedStatus: DataSourceStatus | null = null;

  async resolveMode(forceRefresh = false): Promise<DataSourceStatus> {
    if (
      !forceRefresh &&
      this.cachedStatus &&
      Date.now() - this.cachedStatus.checkedAt < MODE_CACHE_TTL_MS
    ) {
      return this.cachedStatus;
    }

    if (DATA_MODE === 'chain-direct') {
      return this.cache({
        mode: 'chain-direct',
        configuredMode: DATA_MODE,
        reason: 'forced',
        indexerUrl: INDEXER_API_URL || null,
        checkedAt: Date.now(),
      });
    }

    if (DATA_MODE === 'indexer') {
      if (!INDEXER_API_URL) {
        return this.cache({
          mode: 'chain-direct',
          configuredMode: DATA_MODE,
          reason: 'indexer_unconfigured',
          indexerUrl: null,
          checkedAt: Date.now(),
        });
      }

      const healthy = await this.checkIndexerHealth();
      return this.cache({
        mode: healthy ? 'indexer' : 'chain-direct',
        configuredMode: DATA_MODE,
        reason: healthy ? 'forced' : 'indexer_unreachable',
        indexerUrl: INDEXER_API_URL,
        checkedAt: Date.now(),
      });
    }

    if (!INDEXER_API_URL) {
      return this.cache({
        mode: 'chain-direct',
        configuredMode: DATA_MODE,
        reason: 'indexer_unconfigured',
        indexerUrl: null,
        checkedAt: Date.now(),
      });
    }

    const healthy = await this.checkIndexerHealth();
    return this.cache({
      mode: healthy ? 'indexer' : 'chain-direct',
      configuredMode: DATA_MODE,
      reason: healthy ? 'indexer_healthy' : 'indexer_unreachable',
      indexerUrl: INDEXER_API_URL,
      checkedAt: Date.now(),
    });
  }

  private cache(status: DataSourceStatus): DataSourceStatus {
    this.cachedStatus = status;
    return status;
  }

  private async checkIndexerHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), INDEXER_HEALTH_TIMEOUT_MS);
      const response = await fetch(`${INDEXER_API_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      window.clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const dataSourceService = new DataSourceService();
