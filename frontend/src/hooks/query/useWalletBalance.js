import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
export function useWalletBalance() {
    const account = useCurrentAccount();
    return useSuiClientQuery('getBalance', {
        owner: account?.address ?? '0x0',
        coinType: '0x2::sui::SUI',
    }, {
        enabled: Boolean(account?.address),
        refetchInterval: 30000,
    });
}
