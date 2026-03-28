import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDataSourceMode } from '@/hooks/query/useDataSourceMode';
import { useFilterStore } from '@/stores/useFilterStore';
export default function FilterBar() {
    const status = useFilterStore((s) => s.status);
    const setStatus = useFilterStore((s) => s.setStatus);
    const sortBy = useFilterStore((s) => s.sortBy);
    const setSortBy = useFilterStore((s) => s.setSortBy);
    const sortOrder = useFilterStore((s) => s.sortOrder);
    const setSortOrder = useFilterStore((s) => s.setSortOrder);
    const mode = useDataSourceMode();
    return (_jsxs("div", { className: "panel flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Contract Filters" }), _jsx("p", { className: "mt-2 text-sm text-muted", children: mode.data?.mode === 'chain-direct'
                            ? 'Direct chain mode scans recent bounty events and hydrates shared objects from RPC.'
                            : 'Indexer mode uses pre-aggregated API responses for faster filtering and richer history.' })] }), _jsxs("div", { className: "grid gap-3 sm:grid-cols-3", children: [_jsxs("label", { className: "block text-sm text-muted", children: [_jsx("span", { className: "mb-2 block label-muted", children: "Status" }), _jsxs("select", { className: "control-input", value: status ?? -1, onChange: (e) => {
                                    const value = Number(e.target.value);
                                    setStatus(value < 0 ? undefined : value);
                                }, children: [_jsx("option", { value: -1, children: "All" }), _jsx("option", { value: 0, children: "Active" }), _jsx("option", { value: 1, children: "Claimed" }), _jsx("option", { value: 2, children: "Cancelled" }), _jsx("option", { value: 3, children: "Expired" })] })] }), _jsxs("label", { className: "block text-sm text-muted", children: [_jsx("span", { className: "mb-2 block label-muted", children: "Sort Field" }), _jsxs("select", { className: "control-input", value: sortBy, onChange: (e) => setSortBy(e.target.value), children: [_jsx("option", { value: "created_at", children: "Created" }), _jsx("option", { value: "reward_amount", children: "Reward" }), _jsx("option", { value: "expires_at", children: "Expiry" })] })] }), _jsxs("label", { className: "block text-sm text-muted", children: [_jsx("span", { className: "mb-2 block label-muted", children: "Sort Order" }), _jsxs("select", { className: "control-input", value: sortOrder, onChange: (e) => setSortOrder(e.target.value), children: [_jsx("option", { value: "desc", children: "Descending" }), _jsx("option", { value: "asc", children: "Ascending" })] })] })] })] }));
}
