import { DATA_MODE, INDEXER_API_URL, INDEXER_HEALTH_TIMEOUT_MS, } from '@/config/constants';
const MODE_CACHE_TTL_MS = 30000;
class DataSourceService {
    constructor() {
        this.cachedStatus = null;
    }
    async resolveMode(forceRefresh = false) {
        if (!forceRefresh &&
            this.cachedStatus &&
            Date.now() - this.cachedStatus.checkedAt < MODE_CACHE_TTL_MS) {
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
    cache(status) {
        this.cachedStatus = status;
        return status;
    }
    async checkIndexerHealth() {
        try {
            const controller = new AbortController();
            const timeout = window.setTimeout(() => controller.abort(), INDEXER_HEALTH_TIMEOUT_MS);
            const response = await fetch(`${INDEXER_API_URL}/health`, {
                method: 'GET',
                signal: controller.signal,
            });
            window.clearTimeout(timeout);
            return response.ok;
        }
        catch {
            return false;
        }
    }
}
export const dataSourceService = new DataSourceService();
