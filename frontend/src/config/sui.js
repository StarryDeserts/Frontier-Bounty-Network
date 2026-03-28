import { createNetworkConfig } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { LOCALNET_URL } from './constants';
export const networkMap = {
    testnet: { url: getFullnodeUrl('testnet') },
    devnet: { url: getFullnodeUrl('devnet') },
    mainnet: { url: getFullnodeUrl('mainnet') },
    localnet: { url: LOCALNET_URL },
};
export const { networkConfig } = createNetworkConfig(networkMap);
