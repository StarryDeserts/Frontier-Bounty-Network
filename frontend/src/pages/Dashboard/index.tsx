import { Link } from 'react-router-dom';

import { DEFAULT_NETWORK, requireFrontendConfig } from '@/config/constants';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ModeBadge } from '@/components/common/ModeBadge';
import { useBounties } from '@/hooks/query/useBounties';
import { useBountyStats } from '@/hooks/query/useBountyStats';
import { useDataSourceMode } from '@/hooks/query/useDataSourceMode';
import { useLiveFeed } from '@/hooks/query/useLiveFeed';
import { shortenAddress } from '@/utils/address';
import { formatSuiFromMist, formatNumber } from '@/utils/format';

import LiveFeed from './LiveFeed';
import StatsCard from './StatsCard';
import TopBounties from './TopBounties';

const signalCards = [
  { key: 'activeBounties', title: 'Active Bounties', accent: 'text-ice' },
  { key: 'totalBounties', title: 'Total Bounties', accent: 'text-ink' },
  { key: 'totalClaims', title: 'Claims Recorded', accent: 'text-mint' },
  { key: 'topReward', title: 'Top Reward', accent: 'text-amber' },
] as const;

export default function DashboardPage() {
  const config = requireFrontendConfig();
  const mode = useDataSourceMode();
  const stats = useBountyStats();
  const top = useBounties({ sortBy: 'reward_amount', sortOrder: 'desc', pageSize: 5 });
  const feed = useLiveFeed(12);

  return (
    <section className="space-y-6">
      <div className="panel overflow-hidden p-6">
        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] xl:items-start">
          <div>
            <p className="eyebrow">Command Overview</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl text-ice md:text-4xl">Tactical Bounty Command Center</h1>
              {mode.data && <ModeBadge mode={mode.data.mode} />}
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted md:text-base">
              The frontend now runs with dual read paths. When an indexer is reachable it uses indexed APIs; when not, it drops to direct Sui RPC reads for shared objects, events, wallet interactions, and core bounty flows.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs text-muted">
              <span className="rounded-full border border-line/70 bg-steel/60 px-3 py-1.5 uppercase tracking-[0.2em]">network {DEFAULT_NETWORK}</span>
              {mode.data?.mode === 'chain-direct' && (
                <span className="rounded-full border border-amber/35 bg-amber/10 px-3 py-1.5 uppercase tracking-[0.2em] text-amber">
                  indexer-enhanced aggregates degraded
                </span>
              )}
            </div>
            <div className="mt-6 rounded-3xl border border-frost/20 bg-frost/8 p-4">
              <p className="eyebrow">Demo Slice</p>
              <h2 className="mt-2 font-display text-xl text-ink">Smart Gate x Bounty</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                Show judges how live wanted state can become a Smart Gate policy surface: block, surcharge, or alert when a wanted pilot tries to move through player-run infrastructure.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="/smart-gate-demo" className="button-primary">
                  Open Smart Gate Demo
                </Link>
                <Link to="/publish" className="button-secondary">
                  Seed a live bounty
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-3 text-sm md:grid-cols-3 xl:grid-cols-1">
            {[
              ['Package', config.packageId],
              ['Bounty Board', config.bountyBoardId],
              ['Claim Registry', config.claimRegistryId],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-line/60 bg-steel/45 p-4">
                <p className="label-muted">{label}</p>
                <p className="mt-2 font-mono text-xs text-ice">{shortenAddress(value, 10)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {signalCards.map((card) => {
          if (stats.isLoading) {
            return <LoadingSpinner key={card.key} label={`Loading ${card.title.toLowerCase()}...`} />;
          }

          if (stats.isError || !stats.data) {
            return (
              <EmptyState
                key={card.key}
                title={`${card.title} unavailable`}
                description="This metric could not be loaded from the current data path."
              />
            );
          }

          const rawValue = stats.data[card.key];
          const value =
            card.key === 'topReward'
              ? formatSuiFromMist(Number(rawValue))
              : formatNumber(Number(rawValue));

          const detail =
            card.key === 'activeBounties'
              ? 'Shared bounty objects currently active on-chain.'
              : card.key === 'totalClaims'
                ? 'Derived from the claim registry replay guard.'
                : card.key === 'topReward'
                  ? 'Highest currently visible reward in the active query window.'
                  : 'Board-level counter from the shared singleton.';

          return <StatsCard key={card.key} title={card.title} value={value} detail={detail} accent={card.accent} />;
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.9fr]">
        {feed.isLoading ? (
          <LoadingSpinner label="Loading recent chain activity..." />
        ) : feed.isError ? (
          <EmptyState
            title="Live feed unavailable"
            description="Recent bounty-related events could not be read from the current RPC path."
          />
        ) : (
          <LiveFeed events={feed.data ?? []} isDirectMode={mode.data?.mode === 'chain-direct'} />
        )}

        {top.isLoading ? (
          <LoadingSpinner label="Loading priority bounties..." />
        ) : top.isError ? (
          <EmptyState
            title="Bounty list unavailable"
            description="Core bounty objects could not be resolved from the current data path."
          />
        ) : (
          <TopBounties bounties={top.data ?? []} />
        )}
      </div>
    </section>
  );
}
