import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { DEFAULT_NETWORK, requireFrontendConfig } from '@/config/constants';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ModeBadge } from '@/components/common/ModeBadge';
import { useBounties } from '@/hooks/query/useBounties';
import { useBountyStats } from '@/hooks/query/useBountyStats';
import { useDataSourceMode } from '@/hooks/query/useDataSourceMode';
import { useLiveFeed } from '@/hooks/query/useLiveFeed';
import { shortenAddress } from '@/utils/address';
import { formatSuiFromMist, formatNumber } from '@/utils/format';
import LiveFeed from './LiveFeed';
import StatsCard from './StatsCard';
import TopBounties from './TopBounties';
const signalCards = [
    { key: 'activeBounties', title: 'Active Bounties', accent: 'text-ice' },
    { key: 'totalBounties', title: 'Total Bounties', accent: 'text-ink' },
    { key: 'totalClaims', title: 'Claims Recorded', accent: 'text-mint' },
    { key: 'topReward', title: 'Top Reward', accent: 'text-amber' },
];
export default function DashboardPage() {
    const config = requireFrontendConfig();
    const mode = useDataSourceMode();
    const stats = useBountyStats();
    const top = useBounties({ sortBy: 'reward_amount', sortOrder: 'desc', pageSize: 5 });
    const feed = useLiveFeed(12);
    return (_jsxs("section", { className: "space-y-6", children: [_jsx("div", { className: "panel overflow-hidden p-6", children: _jsxs("div", { className: "grid gap-6 xl:grid-cols-[1.4fr_1fr] xl:items-start", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Command Overview" }), _jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-3", children: [_jsx("h1", { className: "font-display text-3xl text-ice md:text-4xl", children: "Tactical Bounty Command Center" }), mode.data && _jsx(ModeBadge, { mode: mode.data.mode })] }), _jsx("p", { className: "mt-4 max-w-3xl text-sm leading-7 text-muted md:text-base", children: "The frontend now runs with dual read paths. When an indexer is reachable it uses indexed APIs; when not, it drops to direct Sui RPC reads for shared objects, events, wallet interactions, and core bounty flows." }), _jsxs("div", { className: "mt-5 flex flex-wrap gap-3 text-xs text-muted", children: [_jsxs("span", { className: "rounded-full border border-line/70 bg-steel/60 px-3 py-1.5 uppercase tracking-[0.2em]", children: ["network ", DEFAULT_NETWORK] }), mode.data?.mode === 'chain-direct' && (_jsx("span", { className: "rounded-full border border-amber/35 bg-amber/10 px-3 py-1.5 uppercase tracking-[0.2em] text-amber", children: "indexer-enhanced aggregates degraded" }))] }), _jsxs("div", { className: "mt-6 rounded-3xl border border-frost/20 bg-frost/8 p-4", children: [_jsx("p", { className: "eyebrow", children: "Demo Slice" }), _jsx("h2", { className: "mt-2 font-display text-xl text-ink", children: "Smart Gate x Bounty" }), _jsx("p", { className: "mt-3 max-w-2xl text-sm leading-6 text-muted", children: "Show judges how live wanted state can become a Smart Gate policy surface: block, surcharge, or alert when a wanted pilot tries to move through player-run infrastructure." }), _jsxs("div", { className: "mt-4 flex flex-wrap gap-3", children: [_jsx(Link, { to: "/smart-gate-demo", className: "button-primary", children: "Open Smart Gate Demo" }), _jsx(Link, { to: "/publish", className: "button-secondary", children: "Seed a live bounty" })] })] })] }), _jsx("div", { className: "grid gap-3 text-sm md:grid-cols-3 xl:grid-cols-1", children: [
                                ['Package', config.packageId],
                                ['Bounty Board', config.bountyBoardId],
                                ['Claim Registry', config.claimRegistryId],
                            ].map(([label, value]) => (_jsxs("div", { className: "rounded-2xl border border-line/60 bg-steel/45 p-4", children: [_jsx("p", { className: "label-muted", children: label }), _jsx("p", { className: "mt-2 font-mono text-xs text-ice", children: shortenAddress(value, 10) })] }, label))) })] }) }), _jsx("div", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4", children: signalCards.map((card) => {
                    if (stats.isLoading) {
                        return _jsx(LoadingSpinner, { label: `Loading ${card.title.toLowerCase()}...` }, card.key);
                    }
                    if (stats.isError || !stats.data) {
                        return (_jsx(EmptyState, { title: `${card.title} unavailable`, description: "This metric could not be loaded from the current data path." }, card.key));
                    }
                    const rawValue = stats.data[card.key];
                    const value = card.key === 'topReward'
                        ? formatSuiFromMist(Number(rawValue))
                        : formatNumber(Number(rawValue));
                    const detail = card.key === 'activeBounties'
                        ? 'Shared bounty objects currently active on-chain.'
                        : card.key === 'totalClaims'
                            ? 'Derived from the claim registry replay guard.'
                            : card.key === 'topReward'
                                ? 'Highest currently visible reward in the active query window.'
                                : 'Board-level counter from the shared singleton.';
                    return _jsx(StatsCard, { title: card.title, value: value, detail: detail, accent: card.accent }, card.key);
                }) }), _jsxs("div", { className: "grid gap-5 xl:grid-cols-[1.2fr_0.9fr]", children: [feed.isLoading ? (_jsx(LoadingSpinner, { label: "Loading recent chain activity..." })) : feed.isError ? (_jsx(EmptyState, { title: "Live feed unavailable", description: "Recent bounty-related events could not be read from the current RPC path." })) : (_jsx(LiveFeed, { events: feed.data ?? [], isDirectMode: mode.data?.mode === 'chain-direct' })), top.isLoading ? (_jsx(LoadingSpinner, { label: "Loading priority bounties..." })) : top.isError ? (_jsx(EmptyState, { title: "Bounty list unavailable", description: "Core bounty objects could not be resolved from the current data path." })) : (_jsx(TopBounties, { bounties: top.data ?? [] }))] })] }));
}
