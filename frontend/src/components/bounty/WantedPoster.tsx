import { Link } from 'react-router-dom';

import { AddressTag } from '@/components/common/AddressTag';
import { CoinAmount } from '@/components/common/CoinAmount';
import { CountdownTimer } from '@/components/common/CountdownTimer';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { Bounty } from '@/types/bounty';

export function WantedPoster({ bounty }: { bounty: Bounty }) {
  return (
    <article className="panel group flex h-full flex-col p-5 transition hover:-translate-y-1 hover:border-frost/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Priority Contract</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <AddressTag address={bounty.target} />
            <StatusBadge status={bounty.status} />
          </div>
        </div>
        <div className="rounded-2xl border border-amber/25 bg-amber/10 px-4 py-3 text-right">
          <p className="label-muted">Reward</p>
          <p className="mt-1 text-lg font-semibold text-amber"><CoinAmount amount={bounty.rewardAmount} /></p>
        </div>
      </div>

      <p className="mt-4 min-h-[72px] text-sm leading-6 text-muted">
        {bounty.description ?? 'No mission brief attached. Operators should inspect the target contract directly.'}
      </p>

      <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-2">
        <div className="rounded-2xl border border-line/60 bg-steel/45 p-3">
          <p className="label-muted">Creator</p>
          <div className="mt-2"><AddressTag address={bounty.creator} /></div>
        </div>
        <div className="rounded-2xl border border-line/60 bg-steel/45 p-3">
          <p className="label-muted">Expiry Window</p>
          <p className="mt-2 font-semibold text-ink"><CountdownTimer expiresAt={bounty.expiresAt} /></p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between pt-1">
        <span className="text-xs uppercase tracking-[0.22em] text-muted">Object {bounty.id.slice(0, 10)}...</span>
        <Link to={`/bounties/${bounty.id}`} className="button-secondary text-xs">
          Inspect Contract
        </Link>
      </div>
    </article>
  );
}
