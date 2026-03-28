import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ModeBadge } from '@/components/common/ModeBadge';
import { useBounties } from '@/hooks/query/useBounties';
import { useDataSourceMode } from '@/hooks/query/useDataSourceMode';
import { useFilterStore } from '@/stores/useFilterStore';
import { BountyBoardErrorBoundary } from './BountyBoardErrorBoundary';
import BountyList from './BountyList';
import FilterBar from './FilterBar';
export default function BountyBoardPage() {
    const status = useFilterStore((state) => state.status);
    const sortBy = useFilterStore((state) => state.sortBy);
    const sortOrder = useFilterStore((state) => state.sortOrder);
    const mode = useDataSourceMode();
    const filter = useMemo(() => ({
        status,
        sortBy,
        sortOrder,
        pageSize: 50,
    }), [status, sortBy, sortOrder]);
    const query = useBounties(filter);
    return (_jsxs("section", { className: "space-y-5", children: [_jsxs("div", { className: "flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Operational Contract Board" }), _jsx("h1", { className: "mt-2 font-display text-3xl text-ice", children: "Bounty Board" }), _jsx("p", { className: "mt-3 max-w-3xl text-sm leading-7 text-muted", children: "Active and historical bounty objects resolved from the current data path. All wallet interactions still execute directly on-chain regardless of read mode." })] }), mode.data && _jsx(ModeBadge, { mode: mode.data.mode })] }), _jsx(BountyBoardErrorBoundary, { children: _jsxs("div", { className: "space-y-5", children: [_jsx(FilterBar, {}), _jsx("div", { className: "min-h-[20rem]", children: query.isLoading ? (_jsx(LoadingSpinner, { label: "Resolving bounty objects..." })) : query.isError ? (_jsx(EmptyState, { title: "Failed to load bounties", description: "The current data path could not resolve bounty objects. Check RPC reachability or indexer health." })) : query.data && query.data.length === 0 ? (_jsx(EmptyState, { title: "No bounties in range", description: "No bounty objects matched the current filter. In direct chain mode, the scan window is intentionally limited to recent events for static-hosted performance." })) : query.data ? (_jsx(BountyList, { bounties: query.data })) : (_jsx(EmptyState, { title: "Bounty board awaiting data", description: "The route mounted, but no result payload was produced. Refresh once and verify the active data mode." })) })] }) })] }));
}
