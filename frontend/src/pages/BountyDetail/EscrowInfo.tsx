import { RewardDisplay } from '@/components/bounty/RewardDisplay';
import { AddressTag } from '@/components/common/AddressTag';
import type { Bounty } from '@/types/bounty';

export default function EscrowInfo({ bounty }: { bounty: Bounty }) {
  return (
    <div className="panel space-y-4 p-5">
      <div>
        <p className="eyebrow">Escrow & Object State</p>
        <h2 className="mt-2 font-display text-xl text-ink">Escrow telemetry</h2>
      </div>
      <RewardDisplay amount={bounty.rewardAmount} />
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <div className="rounded-2xl border border-line/60 bg-steel/45 p-4">
          <p className="label-muted">Bounty Object</p>
          <p className="mt-2 font-mono text-xs text-ice">{bounty.id}</p>
        </div>
        <div className="rounded-2xl border border-line/60 bg-steel/45 p-4">
          <p className="label-muted">Creation Tx</p>
          <div className="mt-2"><AddressTag address={bounty.txDigest} /></div>
        </div>
      </div>
      <p className="text-sm leading-6 text-muted">
        Funds remain locked in escrow until claim, cancellation, or expiry. In chain-direct mode, this panel is sourced from the live shared object rather than indexer projections.
      </p>
    </div>
  );
}
