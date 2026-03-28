import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CoinAmount } from '@/components/common/CoinAmount';
import { formatTime } from '@/utils/time';
export default function MyClaims({ claims }) {
    return (_jsxs("div", { className: "panel p-5", children: [_jsx("p", { className: "eyebrow", children: "Claim History" }), _jsx("h2", { className: "mt-2 font-display text-xl text-ink", children: "Recent verified claims" }), _jsxs("ul", { className: "mt-5 space-y-3 text-sm", children: [claims.map((claim) => (_jsxs("li", { className: "rounded-2xl border border-line/60 bg-steel/45 p-4", children: [_jsxs("p", { className: "font-mono text-xs text-ice", children: ["Target ", claim.target] }), _jsx("div", { className: "mt-2 text-lg font-semibold text-amber", children: _jsx(CoinAmount, { amount: claim.rewardAmount }) }), _jsx("p", { className: "mt-2 text-xs text-muted", children: formatTime(claim.claimedAt) })] }, claim.id))), claims.length === 0 && (_jsx("li", { className: "rounded-2xl border border-dashed border-line/70 bg-graphite/65 p-4 text-muted", children: "No verified claims are currently visible for this wallet." }))] })] }));
}
