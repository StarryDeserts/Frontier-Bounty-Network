import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ConnectButton } from '@mysten/dapp-kit';
const EV_VAULT_DOCS_URL = 'https://docs.evefrontier.com/eve-vault/browser-extension';
export function WalletButton() {
    return (_jsxs("div", { className: "flex flex-col items-end gap-1.5", children: [_jsx(ConnectButton, { connectText: "Connect Wallet", className: "button-primary min-w-[156px] border-frost/50 bg-frost/12 text-ice" }), _jsx("a", { href: EV_VAULT_DOCS_URL, target: "_blank", rel: "noreferrer", className: "text-[11px] font-semibold uppercase tracking-[0.18em] text-muted transition hover:text-ice", children: "Recommended for EVE Frontier players: EV Vault" })] }));
}
