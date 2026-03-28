import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ModeBadge } from '@/components/common/ModeBadge';
import { useDataSourceMode } from '@/hooks/query/useDataSourceMode';
import { useLeaderboard } from '@/hooks/query/useLeaderboard';
import HunterCard from './HunterCard';
import RankTable from './RankTable';
import StatsChart from './StatsChart';
export default function HunterRankingPage() {
    const query = useLeaderboard(50);
    const mode = useDataSourceMode();
    if (query.isLoading)
        return _jsx(LoadingSpinner, { label: "Loading hunter signals..." });
    if (query.isError || !query.data) {
        return (_jsx(EmptyState, { title: "Ranking unavailable", description: "The current data path could not derive hunter ranking data. Check RPC reachability or switch back to indexer mode." }));
    }
    return (_jsxs("section", { className: "space-y-5", children: [_jsxs("div", { className: "flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Hunter Intelligence" }), _jsx("h1", { className: "mt-2 font-display text-3xl text-ice", children: "Hunter Ranking" }), _jsx("p", { className: "mt-3 max-w-3xl text-sm leading-7 text-muted", children: mode.data?.mode === 'chain-direct'
                                    ? 'Direct-chain ranking is a simplified view derived from recent claim and registration events. Full long-range history still benefits from the indexer.'
                                    : 'Indexer mode provides the full projected leaderboard and historical aggregation.' })] }), mode.data && _jsx(ModeBadge, { mode: mode.data.mode })] }), query.data[0] ? _jsx(HunterCard, { hunter: query.data[0] }) : null, query.data.length === 0 ? (_jsx(EmptyState, { title: "No hunters detected", description: "No hunter registration or claim signals were found in the current data window." })) : (_jsxs("div", { className: "grid gap-5 xl:grid-cols-[1.05fr_0.95fr]", children: [_jsx(RankTable, { hunters: query.data }), _jsx(StatsChart, { hunters: query.data.slice(0, 8) })] }))] }));
}
