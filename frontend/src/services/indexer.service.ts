import { INDEXER_API_URL } from '@/config/constants';
import type { Bounty, BountyFilter } from '@/types/bounty';
import type { ClaimRecord } from '@/types/claim';
import type { StatsSnapshot, IndexedEvent } from '@/types/events';
import type { Hunter } from '@/types/hunter';

interface ApiResponse<T> {
  data: T;
}

class IndexerService {
  constructor(private readonly baseUrl: string) {}

  private async request<T>(path: string): Promise<T> {
    if (!this.baseUrl) {
      throw new Error('Indexer API URL is not configured.');
    }

    const res = await fetch(`${this.baseUrl}${path}`);
    if (!res.ok) {
      throw new Error(`Request failed: ${res.status} ${res.statusText}`);
    }
    const body = (await res.json()) as ApiResponse<T>;
    return body.data;
  }

  async getBounties(filter: BountyFilter = {}): Promise<Bounty[]> {
    const params = new URLSearchParams();
    if (filter.status !== undefined) params.set('status', String(filter.status));
    if (filter.target) params.set('target', filter.target);
    if (filter.creator) params.set('creator', filter.creator);
    if (filter.page) params.set('page', String(filter.page));
    if (filter.pageSize) params.set('pageSize', String(filter.pageSize));
    if (filter.sortBy) params.set('sortBy', filter.sortBy);
    if (filter.sortOrder) params.set('sortOrder', filter.sortOrder);

    const query = params.toString();
    return this.request<Bounty[]>(`/api/bounties${query ? `?${query}` : ''}`);
  }

  getBounty(id: string): Promise<Bounty> {
    return this.request<Bounty>(`/api/bounties/${id}`);
  }

  getBountiesByTarget(address: string): Promise<Bounty[]> {
    return this.request<Bounty[]>(`/api/bounties/target/${address}`);
  }

  getBountiesByCreator(address: string): Promise<Bounty[]> {
    return this.request<Bounty[]>(`/api/bounties/creator/${address}`);
  }

  getLeaderboard(limit = 100): Promise<Hunter[]> {
    return this.request<Hunter[]>(`/api/hunters/leaderboard?limit=${limit}`);
  }

  async getHunter(address: string): Promise<Hunter | null> {
    try {
      return await this.request<Hunter>(`/api/hunters/${address}`);
    } catch (error) {
      if ((error as Error).message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  getRecentClaims(limit = 20): Promise<ClaimRecord[]> {
    return this.request<ClaimRecord[]>(`/api/claims/recent?limit=${limit}`);
  }

  getStats(): Promise<StatsSnapshot> {
    return this.request<StatsSnapshot>('/api/stats');
  }

  getRecentEvents(limit = 30): Promise<IndexedEvent[]> {
    return this.request<IndexedEvent[]>(`/api/events/recent?limit=${limit}`);
  }
}

export const indexerService = new IndexerService(INDEXER_API_URL);
