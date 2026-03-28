import type { ActiveDataMode } from '@/types/data-source';

const styles: Record<ActiveDataMode, string> = {
  indexer: 'border-frost/40 bg-frost/10 text-ice',
  'chain-direct': 'border-amber/40 bg-amber/10 text-amber',
};

const labels: Record<ActiveDataMode, string> = {
  indexer: 'Indexer Enhanced',
  'chain-direct': 'Direct Chain Mode',
};

export function ModeBadge({ mode }: { mode: ActiveDataMode }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${styles[mode]}`}>
      {labels[mode]}
    </span>
  );
}
