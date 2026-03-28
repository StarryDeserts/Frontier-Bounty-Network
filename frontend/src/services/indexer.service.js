import { INDEXER_API_URL } from '@/config/constants';
class IndexerService {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    async request(path) {
        if (!this.baseUrl) {
            throw new Error('Indexer API URL is not configured.');
        }
        const res = await fetch(`${this.baseUrl}${path}`);
        if (!res.ok) {
            throw new Error(`Request failed: ${res.status} ${res.statusText}`);
        }
        const body = (await res.json());
        return body.data;
    }
    async getBounties(filter = {}) {
        const params = new URLSearchParams();
        if (filter.status !== undefined)
            params.set('status', String(filter.status));
        if (filter.target)
            params.set('target', filter.target);
        if (filter.creator)
            params.set('creator', filter.creator);
        if (filter.page)
            params.set('page', String(filter.page));
        if (filter.pageSize)
            params.set('pageSize', String(filter.pageSize));
        if (filter.sortBy)
            params.set('sortBy', filter.sortBy);
        if (filter.sortOrder)
            params.set('sortOrder', filter.sortOrder);
        const query = params.toString();
        return this.request(`/api/bounties${query ? `?${query}` : ''}`);
    }
    getBounty(id) {
        return this.request(`/api/bounties/${id}`);
    }
    getBountiesByTarget(address) {
        return this.request(`/api/bounties/target/${address}`);
    }
    getBountiesByCreator(address) {
        return this.request(`/api/bounties/creator/${address}`);
    }
    getLeaderboard(limit = 100) {
        return this.request(`/api/hunters/leaderboard?limit=${limit}`);
    }
    async getHunter(address) {
        try {
            return await this.request(`/api/hunters/${address}`);
        }
        catch (error) {
            if (error.message.includes('404')) {
                return null;
            }
            throw error;
        }
    }
    getRecentClaims(limit = 20) {
        return this.request(`/api/claims/recent?limit=${limit}`);
    }
    getStats() {
        return this.request('/api/stats');
    }
    getRecentEvents(limit = 30) {
        return this.request(`/api/events/recent?limit=${limit}`);
    }
}
export const indexerService = new IndexerService(INDEXER_API_URL);
