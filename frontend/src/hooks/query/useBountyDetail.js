import { useQuery } from '@tanstack/react-query';
import { appDataService } from '@/services/app-data.service';
export function useBountyDetail(id) {
    return useQuery({
        queryKey: ['bounty', id],
        queryFn: () => appDataService.getBounty(id),
        enabled: Boolean(id),
    });
}
