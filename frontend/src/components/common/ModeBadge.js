import { jsx as _jsx } from "react/jsx-runtime";
const styles = {
    indexer: 'border-frost/40 bg-frost/10 text-ice',
    'chain-direct': 'border-amber/40 bg-amber/10 text-amber',
};
const labels = {
    indexer: 'Indexer Enhanced',
    'chain-direct': 'Direct Chain Mode',
};
export function ModeBadge({ mode }) {
    return (_jsx("span", { className: `inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${styles[mode]}`, children: labels[mode] }));
}
