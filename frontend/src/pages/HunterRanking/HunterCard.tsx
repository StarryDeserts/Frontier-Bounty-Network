import { AddressTag } from '@/components/common/AddressTag';
import { CoinAmount } from '@/components/common/CoinAmount';
import type { Hunter } from '@/types/hunter';

export default function HunterCard({ hunter }: { hunter: Hunter }) {
  return (
    <div className="panel p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="eyebrow">Lead Operator</p>
          <h2 className="mt-2 font-display text-xl text-ink">Current top hunter</h2>
        </div>
        <span className="rounded-full border border-frost/35 bg-frost/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-ice">
          #{hunter.rank}
        </span>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <AddressTag address={hunter.address} />
        {hunter.badgeId && <AddressTag address={hunter.badgeId} />}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-line/60 bg-steel/45 p-4">
          <p className="label-muted">Kills</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{hunter.kills}</p>
        </div>
        <div className="rounded-2xl border border-line/60 bg-steel/45 p-4">
          <p className="label-muted">Streak</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{hunter.streak}</p>
        </div>
        <div className="rounded-2xl border border-line/60 bg-steel/45 p-4">
          <p className="label-muted">Earnings</p>
          <div className="mt-2 text-lg font-semibold text-amber"><CoinAmount amount={hunter.totalEarnings} /></div>
        </div>
      </div>
    </div>
  );
}
