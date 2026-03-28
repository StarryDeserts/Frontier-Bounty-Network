import type { BountyStatus } from '@/types/bounty';

const statusMap: Record<BountyStatus, { label: string; cls: string }> = {
  0: { label: 'Active', cls: 'border-frost/40 bg-frost/10 text-ice' },
  1: { label: 'Claimed', cls: 'border-mint/40 bg-mint/10 text-mint' },
  2: { label: 'Cancelled', cls: 'border-line/70 bg-steel/70 text-muted' },
  3: { label: 'Expired', cls: 'border-amber/40 bg-amber/10 text-amber' },
};

export function StatusBadge({ status }: { status: BountyStatus }) {
  const value = statusMap[status];
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${value.cls}`}>{value.label}</span>;
}
