import { formatSuiFromMist } from '@/utils/format';

export function CoinAmount({ amount }: { amount: number }) {
  return <span className="font-semibold text-amber">{formatSuiFromMist(amount)}</span>;
}
