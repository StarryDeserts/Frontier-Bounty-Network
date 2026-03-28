import { Link } from 'react-router-dom';

import { StatusBadge } from '@/components/common/StatusBadge';
import type { Bounty } from '@/types/bounty';

export default function MyBounties({ bounties }: { bounties: Bounty[] }) {
  return (
    <div className="panel p-5">
      <p className="eyebrow">Owned Contracts</p>
      <h2 className="mt-2 font-display text-xl text-ink">Published by this wallet</h2>
      <ul className="mt-5 space-y-3 text-sm">
        {bounties.map((bounty) => (
          <li key={bounty.id} className="flex flex-col gap-3 rounded-2xl border border-line/60 bg-steel/45 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs text-ice">{bounty.target}</p>
              <div className="mt-2"><StatusBadge status={bounty.status} /></div>
            </div>
            <Link to={`/bounties/${bounty.id}`} className="button-secondary text-xs">
              Open
            </Link>
          </li>
        ))}
        {bounties.length === 0 && (
          <li className="rounded-2xl border border-dashed border-line/70 bg-graphite/65 p-4 text-muted">
            No published bounty objects detected for this wallet.
          </li>
        )}
      </ul>
    </div>
  );
}
