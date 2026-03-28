import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ModeBadge } from '@/components/common/ModeBadge';
import { useDataSourceMode } from '@/hooks/query/useDataSourceMode';
import { useLeaderboard } from '@/hooks/query/useLeaderboard';

import HunterCard from './HunterCard';
import RankTable from './RankTable';
import StatsChart from './StatsChart';

export default function HunterRankingPage() {
  const query = useLeaderboard(50);
  const mode = useDataSourceMode();

  if (query.isLoading) return <LoadingSpinner label="Loading hunter signals..." />;
  if (query.isError || !query.data) {
    return (
      <EmptyState
        title="Ranking unavailable"
        description="The current data path could not derive hunter ranking data. Check RPC reachability or switch back to indexer mode."
      />
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Hunter Intelligence</p>
          <h1 className="mt-2 font-display text-3xl text-ice">Hunter Ranking</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
            {mode.data?.mode === 'chain-direct'
              ? 'Direct-chain ranking is a simplified view derived from recent claim and registration events. Full long-range history still benefits from the indexer.'
              : 'Indexer mode provides the full projected leaderboard and historical aggregation.'}
          </p>
        </div>
        {mode.data && <ModeBadge mode={mode.data.mode} />}
      </div>
      {query.data[0] ? <HunterCard hunter={query.data[0]} /> : null}
      {query.data.length === 0 ? (
        <EmptyState
          title="No hunters detected"
          description="No hunter registration or claim signals were found in the current data window."
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <RankTable hunters={query.data} />
          <StatsChart hunters={query.data.slice(0, 8)} />
        </div>
      )}
    </section>
  );
}
