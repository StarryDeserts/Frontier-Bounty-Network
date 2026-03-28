import { formatSuiFromMist } from '@/utils/format';

export default function CostPreview({ rewardMist }: { rewardMist: number }) {
  return (
    <aside className="panel space-y-4 p-5">
      <div>
        <p className="eyebrow">Funding Preview</p>
        <h2 className="mt-2 font-display text-xl text-ink">Escrow estimate</h2>
      </div>
      <div className="rounded-3xl border border-amber/25 bg-amber/10 p-4">
        <p className="label-muted">Reward lock</p>
        <p className="mt-2 text-2xl font-semibold text-amber">{formatSuiFromMist(rewardMist)}</p>
      </div>
      <p className="text-sm leading-6 text-muted">
        Gas varies by network conditions. The reward transfer and bounty creation still execute directly on-chain in both indexer and chain-direct read modes.
      </p>
    </aside>
  );
}
