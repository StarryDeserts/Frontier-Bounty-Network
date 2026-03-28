import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function EmptyState({ title, description, }) {
    return (_jsxs("div", { className: "panel-muted p-8 text-center", children: [_jsx("p", { className: "eyebrow", children: "Signal Gap" }), _jsx("h3", { className: "mt-3 font-display text-xl text-ink", children: title }), _jsx("p", { className: "mx-auto mt-3 max-w-xl text-sm leading-6 text-muted", children: description })] }));
}
