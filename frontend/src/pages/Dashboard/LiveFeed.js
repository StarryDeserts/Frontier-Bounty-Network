import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatTime } from '@/utils/time';
const summarize = (event) => {
    const label = event.eventType.split('::').slice(-1)[0] ?? event.eventType;
    const payload = event.payload;
    if (typeof payload.target === 'string') {
        return `${label} / target ${payload.target.slice(0, 10)}...`;
    }
    if (typeof payload.hunter === 'string') {
        return `${label} / hunter ${payload.hunter.slice(0, 10)}...`;
    }
    return label;
};
export default function LiveFeed({ events, isDirectMode, }) {
    return (_jsxs("div", { className: "panel p-5", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Operational Feed" }), _jsx("h2", { className: "mt-2 font-display text-xl text-ink", children: "Recent chain activity" })] }), isDirectMode && (_jsx("span", { className: "rounded-full border border-amber/35 bg-amber/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber", children: "direct query" }))] }), _jsxs("ul", { className: "mt-5 space-y-3 text-sm", children: [events.slice(0, 8).map((event) => (_jsxs("li", { className: "rounded-2xl border border-line/60 bg-steel/45 p-3", children: [_jsx("p", { className: "font-semibold text-ink", children: summarize(event) }), _jsx("p", { className: "mt-2 text-xs text-muted", children: formatTime(event.createdAt) })] }, event.id))), events.length === 0 && (_jsx("li", { className: "rounded-2xl border border-dashed border-line/70 bg-graphite/65 p-4 text-muted", children: "No recent event signals available yet." }))] })] }));
}
