import type { Bounty, BountyFilter } from '@/types/bounty';
import type { ClaimRecord } from '@/types/claim';
import type { IndexedEvent, StatsSnapshot } from '@/types/events';
import type { Hunter } from '@/types/hunter';

import { chainDataService } from './chain-data.service';
import { dataSourceService } from './data-source.service';
import { indexerService } from './indexer.service';

class AppDataService {
  private async source() {
    const status = await dataSourceService.resolveMode();
    return status.mode === 'indexer' ? indexerService : chainDataService;
  }

  async getBounties(filter: BountyFilter = {}): Promise<Bounty[]> {
    return (await this.source()).getBounties(filter);
  }

  async getBounty(id: string): Promise<Bounty> {
    return (await this.source()).getBounty(id);
  }

  async getHunter(address: string): Promise<Hunter | null> {
    return (await this.source()).getHunter(address);
  }

  async getLeaderboard(limit = 100): Promise<Hunter[]> {
    return (await this.source()).getLeaderboard(limit);
  }

  async getRecentClaims(limit = 20): Promise<ClaimRecord[]> {
    return (await this.source()).getRecentClaims(limit);
  }

  async getStats(): Promise<StatsSnapshot> {
    return (await this.source()).getStats();
  }

  async getRecentEvents(limit = 30): Promise<IndexedEvent[]> {
    return (await this.source()).getRecentEvents(limit);
  }
}

export const appDataService = new AppDataService();
