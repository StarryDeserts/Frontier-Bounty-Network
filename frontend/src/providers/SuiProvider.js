import { jsx as _jsx } from "react/jsx-runtime";
import '@mysten/dapp-kit/dist/index.css';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { DEFAULT_NETWORK } from '@/config/constants';
import { networkConfig } from '@/config/sui';
export function SuiProvider({ children }) {
    return (_jsx(SuiClientProvider, { networks: networkConfig, defaultNetwork: DEFAULT_NETWORK, children: _jsx(WalletProvider, { autoConnect: true, children: children }) }));
}
