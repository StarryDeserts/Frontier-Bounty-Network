import { jsx as _jsx } from "react/jsx-runtime";
import { formatSuiFromMist } from '@/utils/format';
export function CoinAmount({ amount }) {
    return _jsx("span", { className: "font-semibold text-amber", children: formatSuiFromMist(amount) });
}
