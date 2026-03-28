import { StatusBadge } from '@/components/common/StatusBadge';
import type { Bounty } from '@/types/bounty';

export function BountyStatusFlow({ bounty }: { bounty: Bounty }) {
  return (
    <div className="rounded-3xl border border-line/70 bg-steel/45 p-4">
      <p className="label-muted">State Flow</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
        <span className="rounded-full border border-line/60 bg-graphite/70 px-3 py-1.5">Created</span>
        <span className="text-frost/70">/</span>
        <span className="rounded-full border border-line/60 bg-graphite/70 px-3 py-1.5">Escrowed</span>
        <span className="text-frost/70">/</span>
        <StatusBadge status={bounty.status} />
      </div>
    </div>
  );
}
