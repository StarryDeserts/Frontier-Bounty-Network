import { useMemo } from 'react';

import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ModeBadge } from '@/components/common/ModeBadge';
import { useBounties } from '@/hooks/query/useBounties';
import { useDataSourceMode } from '@/hooks/query/useDataSourceMode';
import { useFilterStore } from '@/stores/useFilterStore';

import { BountyBoardErrorBoundary } from './BountyBoardErrorBoundary';
import BountyList from './BountyList';
import FilterBar from './FilterBar';

export default function BountyBoardPage() {
  const status = useFilterStore((state) => state.status);
  const sortBy = useFilterStore((state) => state.sortBy);
  const sortOrder = useFilterStore((state) => state.sortOrder);
  const mode = useDataSourceMode();

  const filter = useMemo(
    () => ({
      status,
      sortBy,
      sortOrder,
      pageSize: 50,
    }),
    [status, sortBy, sortOrder],
  );

  const query = useBounties(filter);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Operational Contract Board</p>
          <h1 className="mt-2 font-display text-3xl text-ice">Bounty Board</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
            Active and historical bounty objects resolved from the current data path. All wallet interactions still execute directly on-chain regardless of read mode.
          </p>
        </div>
        {mode.data && <ModeBadge mode={mode.data.mode} />}
      </div>

      <BountyBoardErrorBoundary>
        <div className="space-y-5">
          <FilterBar />

          <div className="min-h-[20rem]">
            {query.isLoading ? (
              <LoadingSpinner label="Resolving bounty objects..." />
            ) : query.isError ? (
              <EmptyState
                title="Failed to load bounties"
                description="The current data path could not resolve bounty objects. Check RPC reachability or indexer health."
              />
            ) : query.data && query.data.length === 0 ? (
              <EmptyState
                title="No bounties in range"
                description="No bounty objects matched the current filter. In direct chain mode, the scan window is intentionally limited to recent events for static-hosted performance."
              />
            ) : query.data ? (
              <BountyList bounties={query.data} />
            ) : (
              <EmptyState
                title="Bounty board awaiting data"
                description="The route mounted, but no result payload was produced. Refresh once and verify the active data mode."
              />
            )}
          </div>
        </div>
      </BountyBoardErrorBoundary>
    </section>
  );
}
