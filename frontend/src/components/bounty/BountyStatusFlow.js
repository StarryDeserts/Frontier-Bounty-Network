import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { StatusBadge } from '@/components/common/StatusBadge';
export function BountyStatusFlow({ bounty }) {
    return (_jsxs("div", { className: "rounded-3xl border border-line/70 bg-steel/45 p-4", children: [_jsx("p", { className: "label-muted", children: "State Flow" }), _jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-2 text-sm text-muted", children: [_jsx("span", { className: "rounded-full border border-line/60 bg-graphite/70 px-3 py-1.5", children: "Created" }), _jsx("span", { className: "text-frost/70", children: "/" }), _jsx("span", { className: "rounded-full border border-line/60 bg-graphite/70 px-3 py-1.5", children: "Escrowed" }), _jsx("span", { className: "text-frost/70", children: "/" }), _jsx(StatusBadge, { status: bounty.status })] })] }));
}
