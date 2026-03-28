import { useParams } from 'react-router-dom';

import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ModeBadge } from '@/components/common/ModeBadge';
import { useBountyDetail } from '@/hooks/query/useBountyDetail';
import { useDataSourceMode } from '@/hooks/query/useDataSourceMode';

import ClaimSection from './ClaimSection';
import EscrowInfo from './EscrowInfo';
import StatusTimeline from './StatusTimeline';

export default function BountyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useBountyDetail(id);
  const mode = useDataSourceMode();

  if (query.isLoading) return <LoadingSpinner label="Loading bounty object..." />;
  if (query.isError || !query.data) {
    return (
      <EmptyState
        title="Bounty not found"
        description="The bounty object could not be resolved from the current data path. Confirm the object ID and current network."
      />
    );
  }

  const bounty = query.data;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Bounty Object Inspection</p>
          <h1 className="mt-2 font-display text-3xl text-ice">Bounty Detail</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
            Inspect the live shared bounty object, escrow state, and claim interface. This page stays available in both indexer and chain-direct modes.
          </p>
        </div>
        {mode.data && <ModeBadge mode={mode.data.mode} />}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-5">
          <StatusTimeline bounty={bounty} />
          <EscrowInfo bounty={bounty} />
        </div>
        <ClaimSection bounty={bounty} />
      </div>
    </section>
  );
}
