import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CoinAmount } from '@/components/common/CoinAmount';
export function RewardDisplay({ amount }) {
    return (_jsxs("div", { className: "rounded-3xl border border-amber/25 bg-amber/10 p-4", children: [_jsx("p", { className: "label-muted", children: "Reward Escrow" }), _jsx("div", { className: "mt-2 text-lg font-semibold text-amber", children: _jsx(CoinAmount, { amount: amount }) })] }));
}
