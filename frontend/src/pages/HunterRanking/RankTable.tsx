import { AddressTag } from '@/components/common/AddressTag';
import { CoinAmount } from '@/components/common/CoinAmount';
import type { Hunter } from '@/types/hunter';

export default function RankTable({ hunters }: { hunters: Hunter[] }) {
  return (
    <div className="panel overflow-x-auto p-4">
      <p className="eyebrow">Rank Table</p>
      <table className="mt-4 min-w-full text-sm">
        <thead>
          <tr className="text-left text-muted">
            <th className="py-2 pr-3">Rank</th>
            <th className="py-2 pr-3">Hunter</th>
            <th className="py-2 pr-3">Kills</th>
            <th className="py-2">Earnings</th>
          </tr>
        </thead>
        <tbody>
          {hunters.map((hunter) => (
            <tr key={hunter.address} className="border-t border-line/60">
              <td className="py-3 pr-3 text-ice">#{hunter.rank}</td>
              <td className="py-3 pr-3"><AddressTag address={hunter.address} /></td>
              <td className="py-3 pr-3 text-ink">{hunter.kills}</td>
              <td className="py-3"><CoinAmount amount={hunter.totalEarnings} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
