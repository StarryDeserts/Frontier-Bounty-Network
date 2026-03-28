import { formatFrontendConfigDiagnostics, validateFrontendEnvRecord, } from './validate';
const rawEnv = {
    VITE_SUI_NETWORK: import.meta.env.VITE_SUI_NETWORK,
    VITE_DATA_MODE: import.meta.env.VITE_DATA_MODE,
    VITE_PACKAGE_ID: import.meta.env.VITE_PACKAGE_ID,
    VITE_BOUNTY_BOARD_ID: import.meta.env.VITE_BOUNTY_BOARD_ID,
    VITE_CLAIM_REGISTRY_ID: import.meta.env.VITE_CLAIM_REGISTRY_ID,
    VITE_KILL_PROOF_ISSUER_CAP_ID: import.meta.env.VITE_KILL_PROOF_ISSUER_CAP_ID,
    VITE_CLOCK_ID: import.meta.env.VITE_CLOCK_ID,
    VITE_INDEXER_API_URL: import.meta.env.VITE_INDEXER_API_URL,
    VITE_INDEXER_WS_URL: import.meta.env.VITE_INDEXER_WS_URL,
    VITE_INDEXER_HEALTH_TIMEOUT_MS: import.meta.env.VITE_INDEXER_HEALTH_TIMEOUT_MS,
    VITE_LOCALNET_URL: import.meta.env.VITE_LOCALNET_URL,
};
export const FRONTEND_CONFIG_DIAGNOSTICS = validateFrontendEnvRecord(rawEnv);
export const FRONTEND_CONFIG = FRONTEND_CONFIG_DIAGNOSTICS.config;
if (typeof console !== 'undefined') {
    if (FRONTEND_CONFIG_DIAGNOSTICS.isValid && FRONTEND_CONFIG) {
        console.info('[frontend-config] resolved', {
            network: FRONTEND_CONFIG.network,
            dataMode: FRONTEND_CONFIG.dataMode,
            packageId: FRONTEND_CONFIG.packageId,
            bountyBoardId: FRONTEND_CONFIG.bountyBoardId,
            claimRegistryId: FRONTEND_CONFIG.claimRegistryId,
            killProofIssuerCapId: FRONTEND_CONFIG.killProofIssuerCapId,
            clockId: FRONTEND_CONFIG.clockId,
            indexerApiUrl: FRONTEND_CONFIG.indexerApiUrl,
            indexerWsUrl: FRONTEND_CONFIG.indexerWsUrl,
        });
    }
    else {
        console.error('[frontend-config] invalid', formatFrontendConfigDiagnostics(FRONTEND_CONFIG_DIAGNOSTICS), FRONTEND_CONFIG_DIAGNOSTICS.raw);
    }
}
export function requireFrontendConfig() {
    if (!FRONTEND_CONFIG) {
        throw new Error(formatFrontendConfigDiagnostics(FRONTEND_CONFIG_DIAGNOSTICS));
    }
    return FRONTEND_CONFIG;
}
export const DEFAULT_NETWORK = FRONTEND_CONFIG?.network ?? 'testnet';
export const DATA_MODE = FRONTEND_CONFIG?.dataMode ?? 'auto';
export const INDEXER_API_URL = FRONTEND_CONFIG?.indexerApiUrl ?? '';
export const INDEXER_WS_URL = FRONTEND_CONFIG?.indexerWsUrl ?? '';
export const INDEXER_HEALTH_TIMEOUT_MS = FRONTEND_CONFIG?.indexerHealthTimeoutMs ?? 1800;
export const LOCALNET_URL = FRONTEND_CONFIG?.localnetUrl ?? 'http://127.0.0.1:9000';
export const MIST_PER_SUI = 1000000000;
