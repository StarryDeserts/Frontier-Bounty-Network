import '@mysten/dapp-kit/dist/index.css';

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { PropsWithChildren } from 'react';

import { DEFAULT_NETWORK } from '@/config/constants';
import { networkConfig } from '@/config/sui';

export function SuiProvider({ children }: PropsWithChildren) {
  return (
    <SuiClientProvider networks={networkConfig} defaultNetwork={DEFAULT_NETWORK}>
      <WalletProvider autoConnect>{children}</WalletProvider>
    </SuiClientProvider>
  );
}
