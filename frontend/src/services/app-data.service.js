import { chainDataService } from './chain-data.service';
import { dataSourceService } from './data-source.service';
import { indexerService } from './indexer.service';
class AppDataService {
    async source() {
        const status = await dataSourceService.resolveMode();
        return status.mode === 'indexer' ? indexerService : chainDataService;
    }
    async getBounties(filter = {}) {
        return (await this.source()).getBounties(filter);
    }
    async getBounty(id) {
        return (await this.source()).getBounty(id);
    }
    async getHunter(address) {
        return (await this.source()).getHunter(address);
    }
    async getLeaderboard(limit = 100) {
        return (await this.source()).getLeaderboard(limit);
    }
    async getRecentClaims(limit = 20) {
        return (await this.source()).getRecentClaims(limit);
    }
    async getStats() {
        return (await this.source()).getStats();
    }
    async getRecentEvents(limit = 30) {
        return (await this.source()).getRecentEvents(limit);
    }
}
export const appDataService = new AppDataService();
