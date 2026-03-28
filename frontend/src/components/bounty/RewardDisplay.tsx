import { CoinAmount } from '@/components/common/CoinAmount';

export function RewardDisplay({ amount }: { amount: number }) {
  return (
    <div className="rounded-3xl border border-amber/25 bg-amber/10 p-4">
      <p className="label-muted">Reward Escrow</p>
      <div className="mt-2 text-lg font-semibold text-amber">
        <CoinAmount amount={amount} />
      </div>
    </div>
  );
}
