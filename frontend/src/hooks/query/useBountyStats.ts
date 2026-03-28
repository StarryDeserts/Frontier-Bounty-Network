import { useQuery } from '@tanstack/react-query';

import { appDataService } from '@/services/app-data.service';

export function useBountyStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => appDataService.getStats(),
    refetchInterval: 20_000,
  });
}
