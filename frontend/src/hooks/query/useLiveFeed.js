import { useQuery } from '@tanstack/react-query';
import { appDataService } from '@/services/app-data.service';
export function useLiveFeed(limit = 20) {
    return useQuery({
        queryKey: ['recent-events', limit],
        queryFn: () => appDataService.getRecentEvents(limit),
        refetchInterval: 20000,
    });
}
