import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { Hunter } from '@/types/hunter';

export default function StatsChart({ hunters }: { hunters: Hunter[] }) {
  const data = hunters.map((hunter) => ({
    address: hunter.address.slice(0, 8),
    earnings: hunter.totalEarnings / 1_000_000_000,
  }));

  return (
    <div className="panel h-80 p-4">
      <p className="eyebrow">Signal Chart</p>
      <p className="mt-2 text-sm text-muted">Earnings visible in the current ranking window.</p>
      <ResponsiveContainer width="100%" height="82%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(143, 168, 189, 0.15)" strokeDasharray="4 4" />
          <XAxis dataKey="address" stroke="rgba(143, 168, 189, 0.7)" fontSize={11} />
          <YAxis stroke="rgba(143, 168, 189, 0.7)" fontSize={11} />
          <Tooltip
            contentStyle={{
              background: '#0f1a25',
              border: '1px solid rgba(39, 65, 85, 0.9)',
              borderRadius: '18px',
              color: '#e7f3ff',
            }}
          />
          <Bar dataKey="earnings" fill="#89d8ff" radius={[8, 8, 2, 2]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
