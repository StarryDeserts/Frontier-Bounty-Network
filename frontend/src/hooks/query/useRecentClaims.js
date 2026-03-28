import { useQuery } from '@tanstack/react-query';
import { appDataService } from '@/services/app-data.service';
export function useRecentClaims(limit = 20) {
    return useQuery({
        queryKey: ['claims', limit],
        queryFn: () => appDataService.getRecentClaims(limit),
        refetchInterval: 30000,
    });
}
