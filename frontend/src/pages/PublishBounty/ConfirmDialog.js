import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function ConfirmDialog({ open, isPending, onCancel, onConfirm, }) {
    if (!open)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-40 grid place-items-center bg-black/65 p-4 backdrop-blur-sm", children: _jsxs("div", { className: "panel w-full max-w-md p-5", children: [_jsx("p", { className: "eyebrow", children: "Wallet Action Required" }), _jsx("h3", { className: "mt-2 font-display text-xl text-ink", children: "Confirm transaction" }), _jsx("p", { className: "mt-3 text-sm leading-6 text-muted", children: "The wallet will open for signing. Reward funds are transferred into escrow as part of the bounty creation call." }), _jsxs("div", { className: "mt-5 flex justify-end gap-3", children: [_jsx("button", { className: "button-secondary", onClick: onCancel, children: "Cancel" }), _jsx("button", { className: "button-primary disabled:cursor-not-allowed disabled:opacity-50", disabled: isPending, onClick: onConfirm, children: isPending ? 'Submitting...' : 'Confirm' })] })] }) }));
}
