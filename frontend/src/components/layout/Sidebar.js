import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
import { requireFrontendConfig } from '@/config/constants';
import { useDataSourceMode } from '@/hooks/query/useDataSourceMode';
import { shortenAddress } from '@/utils/address';
const links = [
    { to: '/', label: 'Command Overview' },
    { to: '/smart-gate-demo', label: 'Smart Gate Demo' },
    { to: '/bounties', label: 'Bounty Board' },
    { to: '/publish', label: 'Publish Contract' },
    { to: '/hunters', label: 'Hunter Intel' },
    { to: '/profile', label: 'My Profile' },
];
export function Sidebar() {
    const config = requireFrontendConfig();
    const mode = useDataSourceMode();
    return (_jsxs("aside", { className: "hidden w-72 shrink-0 flex-col gap-5 xl:flex", children: [_jsxs("div", { className: "panel p-4", children: [_jsx("p", { className: "eyebrow", children: "Navigation Grid" }), _jsx("div", { className: "mt-4 space-y-2", children: links.map((link) => (_jsx(NavLink, { to: link.to, className: ({ isActive }) => `block rounded-2xl border px-4 py-3 text-sm font-semibold transition ${isActive
                                ? 'border-frost/40 bg-frost/10 text-ice'
                                : 'border-line/70 bg-steel/55 text-muted hover:border-frost/20 hover:text-ink'}`, children: link.label }, link.to))) })] }), _jsxs("div", { className: "panel p-4", children: [_jsx("p", { className: "eyebrow", children: "Live Baseline" }), _jsxs("dl", { className: "mt-4 space-y-3 text-sm", children: [_jsxs("div", { children: [_jsx("dt", { className: "label-muted", children: "Data Path" }), _jsx("dd", { className: "mt-1 font-medium text-ink", children: mode.data?.mode ?? 'Resolving...' })] }), _jsxs("div", { children: [_jsx("dt", { className: "label-muted", children: "Package" }), _jsx("dd", { className: "mt-1 font-mono text-xs text-ice", children: shortenAddress(config.packageId, 8) })] }), _jsxs("div", { children: [_jsx("dt", { className: "label-muted", children: "Bounty Board" }), _jsx("dd", { className: "mt-1 font-mono text-xs text-ice", children: shortenAddress(config.bountyBoardId, 8) })] }), _jsxs("div", { children: [_jsx("dt", { className: "label-muted", children: "Claim Registry" }), _jsx("dd", { className: "mt-1 font-mono text-xs text-ice", children: shortenAddress(config.claimRegistryId, 8) })] })] })] })] }));
}
