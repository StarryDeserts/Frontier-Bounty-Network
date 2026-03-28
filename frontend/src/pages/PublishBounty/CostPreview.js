import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatSuiFromMist } from '@/utils/format';
export default function CostPreview({ rewardMist }) {
    return (_jsxs("aside", { className: "panel space-y-4 p-5", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Funding Preview" }), _jsx("h2", { className: "mt-2 font-display text-xl text-ink", children: "Escrow estimate" })] }), _jsxs("div", { className: "rounded-3xl border border-amber/25 bg-amber/10 p-4", children: [_jsx("p", { className: "label-muted", children: "Reward lock" }), _jsx("p", { className: "mt-2 text-2xl font-semibold text-amber", children: formatSuiFromMist(rewardMist) })] }), _jsx("p", { className: "text-sm leading-6 text-muted", children: "Gas varies by network conditions. The reward transfer and bounty creation still execute directly on-chain in both indexer and chain-direct read modes." })] }));
}
