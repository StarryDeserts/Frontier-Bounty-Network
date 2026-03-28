import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { requireFrontendConfig } from '@/config/constants';
import { AddressTag } from '@/components/common/AddressTag';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ModeBadge } from '@/components/common/ModeBadge';
import { useRegisterGate } from '@/hooks/contract/useRegisterGate';
import { useDataSourceMode } from '@/hooks/query/useDataSourceMode';
import { useWantedList } from '@/hooks/query/useWantedList';
import { shortenAddress } from '@/utils/address';
import { formatSuiFromMist } from '@/utils/format';
const policyOptions = [
    {
        mode: 1,
        label: 'SURCHARGE',
        effect: 'Wanted pilots can still transit, but must pay a penalty to cross the gate.',
        description: 'Best demo path. It shows a live on-chain policy object while staying readable as a player-facing fee or deterrence mechanic.',
        accent: 'border-amber/30 bg-amber/10 text-amber',
    },
    {
        mode: 2,
        label: 'ALERT_ONLY',
        effect: 'Gate stays open, but operators get a wanted-triggered alert for downstream response.',
        description: 'Good for softer infrastructure control. It frames the gate as a routing sensor and escalation point.',
        accent: 'border-frost/35 bg-frost/10 text-ice',
    },
    {
        mode: 0,
        label: 'BLOCK',
        effect: 'Wanted pilots above the reward threshold are denied passage.',
        description: 'Most aggressive mode. Useful for showing a future `canJump` denial surface, but harsher than most judge demos need.',
        accent: 'border-crimson/35 bg-crimson/10 text-crimson',
    },
];
function getTxDigest(result) {
    if (!result || typeof result !== 'object') {
        return null;
    }
    const value = result;
    return value.digest ?? value.effects?.transactionDigest ?? null;
}
function evaluatePolicy(mode, wantedReward, thresholdMist) {
    const threshold = Number(thresholdMist);
    const aboveThreshold = wantedReward >= threshold;
    if (!aboveThreshold) {
        return {
            hookCode: 0,
            label: 'ALLOW',
            detail: 'Target reward is below threshold. Gate extension would allow the jump.',
            cls: 'border-mint/35 bg-mint/10 text-mint',
        };
    }
    if (mode === 0) {
        return {
            hookCode: 1,
            label: 'BLOCK',
            detail: 'Target is wanted above threshold. Gate extension would deny passage.',
            cls: 'border-crimson/35 bg-crimson/10 text-crimson',
        };
    }
    if (mode === 1) {
        return {
            hookCode: 2,
            label: 'SURCHARGE',
            detail: 'Target is wanted above threshold. Gate extension would require a fee before transit.',
            cls: 'border-amber/35 bg-amber/10 text-amber',
        };
    }
    return {
        hookCode: 3,
        label: 'ALERT_ONLY',
        detail: 'Target is wanted above threshold. Gate extension would emit an alert and allow passage.',
        cls: 'border-frost/35 bg-frost/10 text-ice',
    };
}
export default function SmartGateDemoPage() {
    const config = requireFrontendConfig();
    const mode = useDataSourceMode();
    const account = useCurrentAccount();
    const { wanted, isLoading, isError, error } = useWantedList();
    const registerGate = useRegisterGate();
    const [searchParams] = useSearchParams();
    const [selectedMode, setSelectedMode] = useState(1);
    const [minThresholdMist, setMinThresholdMist] = useState('25000000');
    const [surchargeMist, setSurchargeMist] = useState('5000000');
    const [txDigest, setTxDigest] = useState(null);
    const [submitError, setSubmitError] = useState(null);
    const tenant = searchParams.get('tenant') ?? '';
    const itemId = searchParams.get('itemId') ?? '';
    const selectedTarget = wanted[0] ?? null;
    const thresholdMist = BigInt(minThresholdMist || '0');
    const surchargeValue = BigInt(surchargeMist || '0');
    const preview = evaluatePolicy(selectedMode, selectedTarget?.totalReward ?? 0, thresholdMist);
    const selectedPolicy = policyOptions.find((option) => option.mode === selectedMode) ?? policyOptions[0];
    const recommendedEntry = useMemo(() => {
        const params = new URLSearchParams();
        if (tenant) {
            params.set('tenant', tenant);
        }
        else {
            params.set('tenant', 'smart-gate-demo');
        }
        if (itemId) {
            params.set('itemId', itemId);
        }
        else {
            params.set('itemId', config.bountyBoardId);
        }
        return `/smart-gate-demo?${params.toString()}`;
    }, [config.bountyBoardId, itemId, tenant]);
    async function handleRegisterGate() {
        setSubmitError(null);
        setTxDigest(null);
        try {
            const result = await registerGate.mutateAsync({
                mode: selectedMode,
                surcharge: surchargeValue,
                minThreshold: thresholdMist,
            });
            setTxDigest(getTxDigest(result));
        }
        catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Gate policy transaction failed.');
        }
    }
    return (_jsxs("section", { className: "space-y-6", children: [_jsx("div", { className: "panel overflow-hidden p-6", children: _jsxs("div", { className: "grid gap-6 xl:grid-cols-[1.3fr_0.9fr]", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "EVE Frontier Smart Gate Demo Slice" }), _jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-3", children: [_jsx("h1", { className: "font-display text-3xl text-ice md:text-4xl", children: "Wanted players trigger Smart Gate policy" }), mode.data && _jsx(ModeBadge, { mode: mode.data.mode })] }), _jsx("p", { className: "mt-4 max-w-3xl text-sm leading-7 text-muted md:text-base", children: "This page frames Frontier Bounty Network as a Smart Infrastructure policy layer. The live on-chain part is the gate policy object and the wanted state. The staged part is the future game-side hook that would feed the same decision into Smart Gate `canJump` style runtime checks." }), _jsxs("div", { className: "mt-5 grid gap-3 md:grid-cols-2", children: [_jsxs("div", { className: "rounded-2xl border border-line/60 bg-steel/45 p-4", children: [_jsx("p", { className: "label-muted", children: "Why this matters" }), _jsx("p", { className: "mt-2 text-sm leading-6 text-muted", children: "Gates become programmable infrastructure: wanted pilots can be blocked, surcharged, or flagged for downstream interception." })] }), _jsxs("div", { className: "rounded-2xl border border-line/60 bg-steel/45 p-4", children: [_jsx("p", { className: "label-muted", children: "Builder-style entry" }), _jsx("p", { className: "mt-2 text-sm leading-6 text-muted", children: "Optional `tenant` and `itemId` query params make this page easier to drop into an assembly-oriented demo route without reworking the whole app." })] })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "rounded-2xl border border-line/60 bg-steel/45 p-4", children: [_jsx("p", { className: "label-muted", children: "Recommended route entry" }), _jsx("p", { className: "mt-2 break-all font-mono text-xs text-ice", children: recommendedEntry })] }), _jsxs("div", { className: "rounded-2xl border border-line/60 bg-steel/45 p-4", children: [_jsx("p", { className: "label-muted", children: "Tenant" }), _jsx("p", { className: "mt-2 font-mono text-xs text-ice", children: tenant || 'smart-gate-demo' })] }), _jsxs("div", { className: "rounded-2xl border border-line/60 bg-steel/45 p-4", children: [_jsx("p", { className: "label-muted", children: "Item ID" }), _jsx("p", { className: "mt-2 break-all font-mono text-xs text-ice", children: itemId || config.bountyBoardId })] })] })] }) }), _jsxs("div", { className: "grid gap-5 xl:grid-cols-[1.25fr_0.95fr]", children: [_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "panel p-5", children: [_jsxs("div", { className: "flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Policy surface" }), _jsx("h2", { className: "mt-2 font-display text-2xl text-ink", children: "Smart Gate policy modes" })] }), _jsx("span", { className: "rounded-full border border-line/70 bg-steel/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted", children: "Smart Gate custom extension / permit model" })] }), _jsx("div", { className: "mt-5 grid gap-3", children: policyOptions.map((option) => (_jsxs("button", { type: "button", onClick: () => setSelectedMode(option.mode), className: `w-full rounded-3xl border p-4 text-left transition ${selectedMode === option.mode
                                                ? option.accent
                                                : 'border-line/60 bg-steel/45 text-ink hover:border-frost/25'}`, children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "font-display text-lg", children: option.label }), _jsx("p", { className: "mt-2 text-sm leading-6 text-muted", children: option.effect })] }), selectedMode === option.mode && (_jsx("span", { className: "rounded-full border border-current/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]", children: "selected" }))] }), _jsx("p", { className: "mt-3 text-xs leading-5 text-muted", children: option.description })] }, option.mode))) })] }), _jsxs("div", { className: "panel p-5", children: [_jsx("p", { className: "eyebrow", children: "Live wanted input" }), _jsx("h2", { className: "mt-2 font-display text-2xl text-ink", children: "Wanted player signal" }), _jsx("p", { className: "mt-3 text-sm leading-6 text-muted", children: "The demo uses current bounty state as the gate policy input. In chain-direct mode this is derived from recent live bounty objects and events, so judges can still see the slice without an indexer." }), _jsx("div", { className: "mt-5 min-h-[14rem]", children: isLoading ? (_jsx(LoadingSpinner, { label: "Resolving live wanted targets..." })) : isError ? (_jsx(EmptyState, { title: "Wanted view unavailable", description: `The current data path could not resolve active bounty targets${error instanceof Error ? `: ${error.message}` : '.'}` })) : wanted.length === 0 ? (_jsx(EmptyState, { title: "No wanted pilots in current window", description: "Create a bounty first, then return here. In chain-direct mode the page intentionally scans a bounded recent window." })) : (_jsx("div", { className: "space-y-3", children: wanted.slice(0, 5).map((entry, index) => {
                                                const state = evaluatePolicy(selectedMode, entry.totalReward, thresholdMist);
                                                return (_jsxs("div", { className: `rounded-3xl border p-4 ${index === 0 ? state.cls : 'border-line/60 bg-steel/45'}`, children: [_jsxs("div", { className: "flex flex-col gap-3 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "label-muted", children: "Wanted target" }), _jsx("div", { className: "mt-2", children: _jsx(AddressTag, { address: entry.address }) })] }), _jsxs("div", { className: "grid gap-3 text-sm sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("p", { className: "label-muted", children: "Visible reward" }), _jsx("p", { className: "mt-2 font-semibold text-amber", children: formatSuiFromMist(entry.totalReward) })] }), _jsxs("div", { children: [_jsx("p", { className: "label-muted", children: "Gate result" }), _jsx("p", { className: "mt-2 font-semibold text-ink", children: state.label })] })] })] }), _jsx("p", { className: "mt-3 text-xs leading-5 text-muted", children: state.detail })] }, entry.address));
                                            }) })) })] })] }), _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "panel p-5", children: [_jsx("p", { className: "eyebrow", children: "Demo operator console" }), _jsx("h2", { className: "mt-2 font-display text-2xl text-ink", children: "Register gate policy on-chain" }), _jsx("p", { className: "mt-3 text-sm leading-6 text-muted", children: "This uses the same dApp-kit sign-and-execute flow as the rest of the app. Recommended judge path is SURCHARGE because it demonstrates a concrete deterrence mechanic without needing a full live gate runtime." }), _jsxs("div", { className: "mt-5 space-y-4", children: [_jsxs("label", { className: "block text-sm", children: [_jsx("span", { className: "label-muted", children: "Minimum wanted threshold (mist)" }), _jsx("input", { className: "control-input mt-2", value: minThresholdMist, onChange: (event) => setMinThresholdMist(event.target.value.replace(/[^0-9]/g, '')), inputMode: "numeric" })] }), _jsxs("label", { className: "block text-sm", children: [_jsx("span", { className: "label-muted", children: "Surcharge amount (mist)" }), _jsx("input", { className: "control-input mt-2", value: surchargeMist, onChange: (event) => setSurchargeMist(event.target.value.replace(/[^0-9]/g, '')), inputMode: "numeric", disabled: selectedMode !== 1 })] })] }), _jsxs("div", { className: "mt-5 rounded-3xl border border-line/60 bg-steel/45 p-4", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "label-muted", children: "Current preview" }), _jsx("p", { className: "mt-2 font-display text-lg text-ice", children: selectedPolicy.label })] }), _jsxs("span", { className: `rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${preview.cls}`, children: ["hook result ", preview.hookCode] })] }), _jsx("p", { className: "mt-3 text-sm leading-6 text-muted", children: preview.detail }), _jsxs("div", { className: "mt-4 grid gap-3 text-sm sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("p", { className: "label-muted", children: "Threshold" }), _jsx("p", { className: "mt-2 text-ink", children: formatSuiFromMist(Number(thresholdMist)) })] }), _jsxs("div", { children: [_jsx("p", { className: "label-muted", children: "Surcharge" }), _jsx("p", { className: "mt-2 text-ink", children: selectedMode === 1 ? formatSuiFromMist(Number(surchargeValue)) : 'Not applied' })] })] })] }), _jsx("button", { type: "button", className: "button-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50", disabled: !account || registerGate.isPending, onClick: handleRegisterGate, children: registerGate.isPending ? 'Submitting gate policy...' : 'Register Smart Gate policy' }), !account && (_jsx("p", { className: "mt-3 text-xs leading-5 text-muted", children: "Connect a wallet first. For judge demos in an external browser, EV Vault is the recommended EVE Frontier wallet path." })), submitError && (_jsx("p", { className: "mt-3 rounded-2xl border border-crimson/35 bg-crimson/10 px-4 py-3 text-sm text-crimson", children: submitError })), txDigest && (_jsxs("div", { className: "mt-3 rounded-2xl border border-mint/30 bg-mint/10 px-4 py-3", children: [_jsx("p", { className: "label-muted", children: "Gate policy tx digest" }), _jsx("p", { className: "mt-2 break-all font-mono text-xs text-mint", children: txDigest })] }))] }), _jsxs("div", { className: "panel p-5", children: [_jsx("p", { className: "eyebrow", children: "What is live vs staged" }), _jsxs("div", { className: "mt-4 grid gap-3", children: [_jsxs("div", { className: "rounded-2xl border border-mint/30 bg-mint/10 p-4", children: [_jsx("p", { className: "font-semibold text-mint", children: "Live / chain-backed now" }), _jsx("p", { className: "mt-2 text-sm leading-6 text-muted", children: "Wanted state from the bounty board, wallet-triggered `register_bounty_gate`, and direct transaction signing through the browser wallet." })] }), _jsxs("div", { className: "rounded-2xl border border-amber/30 bg-amber/10 p-4", children: [_jsx("p", { className: "font-semibold text-amber", children: "Staged integration" }), _jsx("p", { className: "mt-2 text-sm leading-6 text-muted", children: "The actual Smart Gate runtime hook. Today this page demonstrates the policy surface and the expected result that a future `canJump` extension would consume." })] })] }), _jsxs("div", { className: "mt-5 space-y-3 text-sm text-muted", children: [_jsxs("div", { className: "rounded-2xl border border-line/60 bg-steel/45 p-4", children: [_jsx("p", { className: "label-muted", children: "Package" }), _jsx("p", { className: "mt-2 font-mono text-xs text-ice", children: shortenAddress(config.packageId, 10) })] }), _jsxs("div", { className: "rounded-2xl border border-line/60 bg-steel/45 p-4", children: [_jsx("p", { className: "label-muted", children: "Bounty board singleton" }), _jsx("p", { className: "mt-2 font-mono text-xs text-ice", children: shortenAddress(config.bountyBoardId, 10) })] })] }), _jsxs("div", { className: "mt-5 flex flex-wrap gap-3", children: [_jsx(Link, { to: "/publish", className: "button-secondary", children: "Publish a bounty first" }), _jsx(Link, { to: "/bounties", className: "button-secondary", children: "Open Bounty Board" })] })] })] })] })] }));
}
