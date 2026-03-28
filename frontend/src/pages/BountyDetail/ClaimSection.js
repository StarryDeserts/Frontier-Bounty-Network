import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useState } from 'react';
import { useClaimBounty } from '@/hooks/contract/useClaimBounty';
export default function ClaimSection({ bounty }) {
    const account = useCurrentAccount();
    const [killProofId, setKillProofId] = useState('');
    const [hunterBadgeId, setHunterBadgeId] = useState('');
    const { claimBounty, isPending } = useClaimBounty();
    return (_jsxs("aside", { className: "panel space-y-4 p-5", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Claim Interface" }), _jsx("h2", { className: "mt-2 font-display text-xl text-ink", children: "Manual proof-assisted claim" })] }), _jsx("p", { className: "text-sm leading-6 text-muted", children: "Claim submission is live on-chain, but production proof issuance is still operator-assisted. You need a valid KillProof object plus a HunterBadge owned by the connected wallet." }), _jsx("input", { value: killProofId, onChange: (e) => setKillProofId(e.target.value), placeholder: "KillProof object ID", className: "control-input" }), _jsx("input", { value: hunterBadgeId, onChange: (e) => setHunterBadgeId(e.target.value), placeholder: "HunterBadge object ID", className: "control-input" }), _jsx("button", { className: "button-primary w-full disabled:cursor-not-allowed disabled:opacity-50", disabled: !account || !killProofId || !hunterBadgeId || isPending || bounty.status !== 0, onClick: () => claimBounty({ bountyId: bounty.id, killProofId, hunterBadgeId }), children: isPending ? 'Submitting claim...' : 'Submit Claim Transaction' }), _jsx("p", { className: "text-xs leading-5 text-muted", children: "If you do not have a proof yet, use the operator/manual issuance flow documented in the claim live plan." })] }));
}
