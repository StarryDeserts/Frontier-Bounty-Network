import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useRegisterHunter } from '@/hooks/contract/useRegisterHunter';
export default function Settings() {
    const account = useCurrentAccount();
    const { registerHunter, isPending } = useRegisterHunter();
    return (_jsxs("div", { className: "panel p-5", children: [_jsx("p", { className: "eyebrow", children: "Operator Actions" }), _jsx("h2", { className: "mt-2 font-display text-xl text-ink", children: "Wallet-triggered actions" }), _jsx("p", { className: "mt-3 text-sm leading-6 text-muted", children: "Registering a hunter badge is a direct on-chain action and remains available even when the frontend is running without an indexer." }), _jsx("button", { className: "button-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50", disabled: isPending || !account, onClick: () => registerHunter(), children: isPending ? 'Submitting...' : 'Register Hunter Badge' })] }));
}
