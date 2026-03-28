import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
import { DEFAULT_NETWORK } from '@/config/constants';
import { ConfigStatusBadge } from '@/components/common/ConfigStatusBadge';
import { WalletButton } from '@/components/common/WalletButton';
import { ModeBadge } from '@/components/common/ModeBadge';
import { useDataSourceMode } from '@/hooks/query/useDataSourceMode';
const links = [
    { to: '/', label: 'Dashboard' },
    { to: '/smart-gate-demo', label: 'Smart Gate Demo' },
    { to: '/bounties', label: 'Bounty Board' },
    { to: '/publish', label: 'Publish' },
    { to: '/hunters', label: 'Hunters' },
    { to: '/profile', label: 'My Profile' },
];
export function Header() {
    const mode = useDataSourceMode();
    return (_jsx("header", { className: "sticky top-0 z-30 border-b border-line/60 bg-void/82 backdrop-blur-xl", children: _jsxs("div", { className: "mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-4 md:px-6 xl:px-8", children: [_jsxs("div", { className: "flex flex-col justify-between gap-4 lg:flex-row lg:items-center", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "EVE Frontier / Sovereign Tactical Network" }), _jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-3", children: [_jsx("div", { className: "font-display text-2xl font-bold tracking-[0.08em] text-ice md:text-3xl", children: "Frontier Bounty Network" }), mode.data && _jsx(ModeBadge, { mode: mode.data.mode }), _jsx(ConfigStatusBadge, {})] }), _jsx("p", { className: "mt-3 max-w-3xl text-sm leading-6 text-muted", children: "Bounty infrastructure for Smart Gates, Smart Turrets, and future EVE Frontier kill-record flows." })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx("span", { className: "rounded-full border border-line/80 bg-steel/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted", children: DEFAULT_NETWORK }), _jsx(WalletButton, {})] })] }), _jsx("nav", { className: "flex flex-wrap gap-2", children: links.map((link) => (_jsx(NavLink, { to: link.to, className: ({ isActive }) => `rounded-full border px-4 py-2 text-sm font-semibold transition ${isActive
                            ? 'border-frost/40 bg-frost/12 text-ice shadow-glow'
                            : 'border-line/70 bg-steel/55 text-muted hover:border-frost/20 hover:text-ice'}`, children: link.label }, link.to))) })] }) }));
}
