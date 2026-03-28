import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function StatsCard({ title, value, detail, accent = 'text-ice', }) {
    return (_jsxs("div", { className: "panel p-4", children: [_jsx("p", { className: "label-muted", children: title }), _jsx("p", { className: `mt-3 text-3xl font-semibold ${accent}`, children: value }), detail && _jsx("p", { className: "mt-2 text-sm text-muted", children: detail })] }));
}
