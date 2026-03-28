import { CoinAmount } from '@/components/common/CoinAmount';
import type { ClaimRecord } from '@/types/claim';
import { formatTime } from '@/utils/time';

export default function MyClaims({ claims }: { claims: ClaimRecord[] }) {
  return (
    <div className="panel p-5">
      <p className="eyebrow">Claim History</p>
      <h2 className="mt-2 font-display text-xl text-ink">Recent verified claims</h2>
      <ul className="mt-5 space-y-3 text-sm">
        {claims.map((claim) => (
          <li key={claim.id} className="rounded-2xl border border-line/60 bg-steel/45 p-4">
            <p className="font-mono text-xs text-ice">Target {claim.target}</p>
            <div className="mt-2 text-lg font-semibold text-amber"><CoinAmount amount={claim.rewardAmount} /></div>
            <p className="mt-2 text-xs text-muted">{formatTime(claim.claimedAt)}</p>
          </li>
        ))}
        {claims.length === 0 && (
          <li className="rounded-2xl border border-dashed border-line/70 bg-graphite/65 p-4 text-muted">
            No verified claims are currently visible for this wallet.
          </li>
        )}
      </ul>
    </div>
  );
}
