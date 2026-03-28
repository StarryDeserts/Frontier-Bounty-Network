import { useQuery } from '@tanstack/react-query';

import { appDataService } from '@/services/app-data.service';
import type { BountyFilter } from '@/types/bounty';

export function useBounties(filter: BountyFilter = {}) {
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
    refetchInterval: 30_000,
    staleTime: 15_000,
    placeholderData: (previousData) => previousData,
  });
}
