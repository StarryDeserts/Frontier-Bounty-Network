import { useDataSourceMode } from '@/hooks/query/useDataSourceMode';
import { useFilterStore } from '@/stores/useFilterStore';

export default function FilterBar() {
  const status = useFilterStore((s) => s.status);
  const setStatus = useFilterStore((s) => s.setStatus);
  const sortBy = useFilterStore((s) => s.sortBy);
  const setSortBy = useFilterStore((s) => s.setSortBy);
  const sortOrder = useFilterStore((s) => s.sortOrder);
  const setSortOrder = useFilterStore((s) => s.setSortOrder);
  const mode = useDataSourceMode();

  return (
    <div className="panel flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="eyebrow">Contract Filters</p>
        <p className="mt-2 text-sm text-muted">
          {mode.data?.mode === 'chain-direct'
            ? 'Direct chain mode scans recent bounty events and hydrates shared objects from RPC.'
            : 'Indexer mode uses pre-aggregated API responses for faster filtering and richer history.'}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm text-muted">
          <span className="mb-2 block label-muted">Status</span>
          <select
            className="control-input"
            value={status ?? -1}
            onChange={(e) => {
              const value = Number(e.target.value);
              setStatus(value < 0 ? undefined : (value as 0 | 1 | 2 | 3));
            }}
          >
            <option value={-1}>All</option>
            <option value={0}>Active</option>
            <option value={1}>Claimed</option>
            <option value={2}>Cancelled</option>
            <option value={3}>Expired</option>
          </select>
        </label>

        <label className="block text-sm text-muted">
          <span className="mb-2 block label-muted">Sort Field</span>
          <select
            className="control-input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'created_at' | 'reward_amount' | 'expires_at')}
          >
            <option value="created_at">Created</option>
            <option value="reward_amount">Reward</option>
            <option value="expires_at">Expiry</option>
          </select>
        </label>

        <label className="block text-sm text-muted">
          <span className="mb-2 block label-muted">Sort Order</span>
          <select
            className="control-input"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
      </div>
    </div>
  );
}
