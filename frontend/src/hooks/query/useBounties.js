import { useQuery } from '@tanstack/react-query';
import { appDataService } from '@/services/app-data.service';
export function useBounties(filter = {}) {
    return useQuery({
        queryKey: [
            'bounties',
            filter.status ?? 'all',
            filter.target ?? '',
            filter.creator ?? '',
            filter.page ?? 1,
            filter.pageSize ?? 20,
            filter.sortBy ?? 'created_at',
            filter.sortOrder ?? 'desc',
        ],
        queryFn: () => appDataService.getBounties(filter),
        refetchInterval: 30000,
        staleTime: 15000,
        placeholderData: (previousData) => previousData,
    });
}
