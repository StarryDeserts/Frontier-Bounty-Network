import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { MIST_PER_SUI } from '@/config/constants';
import { ModeBadge } from '@/components/common/ModeBadge';
import { useCreateBounty } from '@/hooks/contract/useCreateBounty';
import { useDataSourceMode } from '@/hooks/query/useDataSourceMode';
import BountyForm from './BountyForm';
import ConfirmDialog from './ConfirmDialog';
import CostPreview from './CostPreview';
export default function PublishBountyPage() {
    const [form, setForm] = useState({
        target: '',
        rewardSui: '1',
        durationHours: 24,
        description: '',
    });
    const [confirming, setConfirming] = useState(false);
    const { createBounty, isPending } = useCreateBounty();
    const mode = useDataSourceMode();
    const rewardMist = BigInt(Math.floor(Number(form.rewardSui || '0') * MIST_PER_SUI));
    const submit = async () => {
        await createBounty({
            target: form.target,
            rewardAmount: rewardMist,
            durationHours: form.durationHours,
            description: form.description,
        });
        setConfirming(false);
    };
    return (_jsxs("section", { className: "space-y-5", children: [_jsxs("div", { className: "flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Mission Publication" }), _jsx("h1", { className: "mt-2 font-display text-3xl text-ice", children: "Publish Bounty" }), _jsx("p", { className: "mt-3 max-w-3xl text-sm leading-7 text-muted", children: "Read mode does not affect writes. Even on a static site with no indexer, this flow still builds and signs a live Sui transaction through the connected wallet." })] }), mode.data && _jsx(ModeBadge, { mode: mode.data.mode })] }), _jsxs("div", { className: "grid gap-5 xl:grid-cols-[1.3fr_0.7fr]", children: [_jsx(BountyForm, { form: form, onChange: setForm, onSubmit: () => setConfirming(true) }), _jsx(CostPreview, { rewardMist: Number(rewardMist) })] }), _jsx(ConfirmDialog, { open: confirming, isPending: isPending, onCancel: () => setConfirming(false), onConfirm: submit })] }));
}
