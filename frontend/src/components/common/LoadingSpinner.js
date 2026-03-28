import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function LoadingSpinner({ label = 'Loading tactical view...' }) {
    return (_jsxs("div", { className: "panel-muted overflow-hidden p-5", children: [_jsx("div", { className: "h-1.5 w-24 rounded-full bg-frost/40" }), _jsxs("div", { className: "mt-4 grid gap-3 md:grid-cols-3", children: [_jsx("div", { className: "h-24 animate-pulse rounded-2xl bg-steel/70" }), _jsx("div", { className: "h-24 animate-pulse rounded-2xl bg-steel/70 md:col-span-2" })] }), _jsx("p", { className: "mt-4 text-sm text-muted", children: label })] }));
}
