import { Link } from 'react-router-dom';

import { CoinAmount } from '@/components/common/CoinAmount';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { Bounty } from '@/types/bounty';

export default function TopBounties({ bounties }: { bounties: Bounty[] }) {
  return (
    <div className="panel p-5">
      <p className="eyebrow">Priority Queue</p>
      <h2 className="mt-2 font-display text-xl text-ink">High-value contracts</h2>
      <ol className="mt-5 space-y-3 text-sm">
        {bounties.slice(0, 5).map((bounty) => (
          <li key={bounty.id} className="flex flex-col gap-3 rounded-2xl border border-line/60 bg-steel/45 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs text-ice">{bounty.target}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={bounty.status} />
                <span className="text-xs text-muted">Creator {bounty.creator.slice(0, 10)}...</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CoinAmount amount={bounty.rewardAmount} />
              <Link to={`/bounties/${bounty.id}`} className="button-secondary text-xs">
                Open
              </Link>
            </div>
          </li>
        ))}
        {bounties.length === 0 && (
          <li className="rounded-2xl border border-dashed border-line/70 bg-graphite/65 p-4 text-muted">
            No active bounty objects discovered in the current query window.
          </li>
        )}
      </ol>
    </div>
  );
}
