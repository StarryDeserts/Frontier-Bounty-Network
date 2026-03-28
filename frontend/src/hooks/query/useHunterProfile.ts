import { useQuery } from '@tanstack/react-query';

import { appDataService } from '@/services/app-data.service';

export function useHunterProfile(address?: string) {
  return useQuery({
    queryKey: ['hunter', address],
    queryFn: () => appDataService.getHunter(address!),
    enabled: Boolean(address),
  });
}
