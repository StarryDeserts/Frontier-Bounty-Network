import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ModeBadge } from '@/components/common/ModeBadge';
import { useBountyDetail } from '@/hooks/query/useBountyDetail';
import { useDataSourceMode } from '@/hooks/query/useDataSourceMode';
import ClaimSection from './ClaimSection';
import EscrowInfo from './EscrowInfo';
import StatusTimeline from './StatusTimeline';
export default function BountyDetailPage() {
    const { id } = useParams();
    const query = useBountyDetail(id);
    const mode = useDataSourceMode();
    if (query.isLoading)
        return _jsx(LoadingSpinner, { label: "Loading bounty object..." });
    if (query.isError || !query.data) {
        return (_jsx(EmptyState, { title: "Bounty not found", description: "The bounty object could not be resolved from the current data path. Confirm the object ID and current network." }));
    }
    const bounty = query.data;
    return (_jsxs("section", { className: "space-y-5", children: [_jsxs("div", { className: "flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Bounty Object Inspection" }), _jsx("h1", { className: "mt-2 font-display text-3xl text-ice", children: "Bounty Detail" }), _jsx("p", { className: "mt-3 max-w-3xl text-sm leading-7 text-muted", children: "Inspect the live shared bounty object, escrow state, and claim interface. This page stays available in both indexer and chain-direct modes." })] }), mode.data && _jsx(ModeBadge, { mode: mode.data.mode })] }), _jsxs("div", { className: "grid gap-5 xl:grid-cols-[1.4fr_0.9fr]", children: [_jsxs("div", { className: "space-y-5", children: [_jsx(StatusTimeline, { bounty: bounty }), _jsx(EscrowInfo, { bounty: bounty })] }), _jsx(ClaimSection, { bounty: bounty })] })] }));
}
