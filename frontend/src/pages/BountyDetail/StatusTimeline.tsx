import { BountyStatusFlow } from '@/components/bounty/BountyStatusFlow';
import { AddressTag } from '@/components/common/AddressTag';
import type { Bounty } from '@/types/bounty';
import { formatTime } from '@/utils/time';

export default function StatusTimeline({ bounty }: { bounty: Bounty }) {
  return (
    <div className="panel space-y-4 p-5">
      <div>
        <p className="eyebrow">Execution Timeline</p>
        <h2 className="mt-2 font-display text-xl text-ink">Contract lifecycle</h2>
      </div>
      <BountyStatusFlow bounty={bounty} />
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <div className="rounded-2xl border border-line/60 bg-steel/45 p-4">
          <p className="label-muted">Creator</p>
          <div className="mt-2"><AddressTag address={bounty.creator} /></div>
        </div>
        <div className="rounded-2xl border border-line/60 bg-steel/45 p-4">
          <p className="label-muted">Target</p>
          <div className="mt-2"><AddressTag address={bounty.target} /></div>
        </div>
        <div className="rounded-2xl border border-line/60 bg-steel/45 p-4">
          <p className="label-muted">Created</p>
          <p className="mt-2 text-ink">{formatTime(bounty.createdAt)}</p>
        </div>
        <div className="rounded-2xl border border-line/60 bg-steel/45 p-4">
          <p className="label-muted">Expires</p>
          <p className="mt-2 text-ink">{formatTime(bounty.expiresAt)}</p>
        </div>
      </div>
      {bounty.description && (
        <div className="rounded-2xl border border-line/60 bg-steel/45 p-4 text-sm leading-6 text-muted">
          {bounty.description}
        </div>
      )}
    </div>
  );
}
