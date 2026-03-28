import { useQuery } from '@tanstack/react-query';
import { dataSourceService } from '@/services/data-source.service';
export function useDataSourceMode() {
    return useQuery({
        queryKey: ['data-source-mode'],
        queryFn: () => dataSourceService.resolveMode(),
        staleTime: 60000,
        retry: false,
    });
}
