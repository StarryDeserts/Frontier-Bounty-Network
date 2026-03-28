import { AddressTag } from '@/components/common/AddressTag';
import { CoinAmount } from '@/components/common/CoinAmount';
import type { Hunter } from '@/types/hunter';

export default function BadgeDisplay({ hunter, address }: { hunter: Hunter | null; address: string }) {
  return (
    <div className="panel p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="eyebrow">Hunter Identity</p>
          <h2 className="mt-2 font-display text-xl text-ink">Primary badge status</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AddressTag address={address} />
          <span className="rounded-full border border-line/70 bg-steel/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted">
            Rank {hunter?.rank || '-'}
          </span>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-line/60 bg-steel/45 p-4">
          <p className="label-muted">Badge</p>
          <p className="mt-2 font-mono text-xs text-ice">{hunter?.badgeId ?? 'Not registered'}</p>
        </div>
        <div className="rounded-2xl border border-line/60 bg-steel/45 p-4">
          <p className="label-muted">Kills</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{hunter?.kills ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-line/60 bg-steel/45 p-4">
          <p className="label-muted">Streak</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{hunter?.streak ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-line/60 bg-steel/45 p-4">
          <p className="label-muted">Earnings</p>
          <div className="mt-2 text-lg font-semibold text-amber"><CoinAmount amount={hunter?.totalEarnings ?? 0} /></div>
        </div>
      </div>
    </div>
  );
}
