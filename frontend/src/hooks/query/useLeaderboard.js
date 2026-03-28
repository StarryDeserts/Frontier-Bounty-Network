import { useQuery } from '@tanstack/react-query';
import { appDataService } from '@/services/app-data.service';
export function useLeaderboard(limit = 100) {
    return useQuery({
        queryKey: ['leaderboard', limit],
        queryFn: () => appDataService.getLeaderboard(limit),
        refetchInterval: 30000,
    });
}
