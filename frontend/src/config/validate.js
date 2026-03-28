import { isValidSuiAddress, normalizeSuiAddress } from '@mysten/sui/utils';
const ZERO_ID = normalizeSuiAddress('0x0');
const DEFAULT_LOCALNET_URL = 'http://127.0.0.1:9000';
const allowedNetworks = new Set(['testnet', 'devnet', 'mainnet', 'localnet']);
const allowedModes = new Set(['auto', 'indexer', 'chain-direct']);
const clean = (value) => value?.trim() ?? '';
const parseId = (name, value, errors) => {
    if (!value) {
        errors.push(`${name} is required.`);
        return value;
    }
    const normalized = normalizeSuiAddress(value);
    if (!isValidSuiAddress(normalized)) {
        errors.push(`${name} must be a valid Sui object or package ID. Received: ${value}`);
        return value;
    }
    if (normalized === ZERO_ID) {
        errors.push(`${name} must not be 0x0.`);
    }
    return normalized;
};
export function validateFrontendEnvRecord(env) {
    const errors = [];
    const raw = {
        VITE_SUI_NETWORK: clean(env.VITE_SUI_NETWORK) || 'testnet',
        VITE_DATA_MODE: clean(env.VITE_DATA_MODE) || 'auto',
        VITE_PACKAGE_ID: clean(env.VITE_PACKAGE_ID),
        VITE_BOUNTY_BOARD_ID: clean(env.VITE_BOUNTY_BOARD_ID),
        VITE_CLAIM_REGISTRY_ID: clean(env.VITE_CLAIM_REGISTRY_ID),
        VITE_KILL_PROOF_ISSUER_CAP_ID: clean(env.VITE_KILL_PROOF_ISSUER_CAP_ID),
        VITE_CLOCK_ID: clean(env.VITE_CLOCK_ID),
        VITE_INDEXER_API_URL: clean(env.VITE_INDEXER_API_URL),
        VITE_INDEXER_WS_URL: clean(env.VITE_INDEXER_WS_URL),
        VITE_INDEXER_HEALTH_TIMEOUT_MS: clean(env.VITE_INDEXER_HEALTH_TIMEOUT_MS),
        VITE_LOCALNET_URL: clean(env.VITE_LOCALNET_URL) || DEFAULT_LOCALNET_URL,
    };
    const network = allowedNetworks.has(raw.VITE_SUI_NETWORK)
        ? raw.VITE_SUI_NETWORK
        : 'testnet';
    if (!allowedNetworks.has(raw.VITE_SUI_NETWORK)) {
        errors.push(`VITE_SUI_NETWORK must be one of testnet, devnet, mainnet, localnet. Received: ${raw.VITE_SUI_NETWORK}`);
    }
    const dataMode = allowedModes.has(raw.VITE_DATA_MODE)
        ? raw.VITE_DATA_MODE
        : 'auto';
    if (!allowedModes.has(raw.VITE_DATA_MODE)) {
        errors.push(`VITE_DATA_MODE must be one of auto, indexer, chain-direct. Received: ${raw.VITE_DATA_MODE}`);
    }
    const packageId = parseId('VITE_PACKAGE_ID', raw.VITE_PACKAGE_ID, errors);
    const bountyBoardId = parseId('VITE_BOUNTY_BOARD_ID', raw.VITE_BOUNTY_BOARD_ID, errors);
    const claimRegistryId = parseId('VITE_CLAIM_REGISTRY_ID', raw.VITE_CLAIM_REGISTRY_ID, errors);
    const killProofIssuerCapId = parseId('VITE_KILL_PROOF_ISSUER_CAP_ID', raw.VITE_KILL_PROOF_ISSUER_CAP_ID, errors);
    const clockId = parseId('VITE_CLOCK_ID', raw.VITE_CLOCK_ID, errors);
    const timeout = raw.VITE_INDEXER_HEALTH_TIMEOUT_MS
        ? Number(raw.VITE_INDEXER_HEALTH_TIMEOUT_MS)
        : 1800;
    if (!Number.isFinite(timeout) || timeout <= 0) {
        errors.push(`VITE_INDEXER_HEALTH_TIMEOUT_MS must be a positive number. Received: ${raw.VITE_INDEXER_HEALTH_TIMEOUT_MS}`);
    }
    const config = errors.length
        ? null
        : {
            network,
            dataMode,
            packageId,
            bountyBoardId,
            claimRegistryId,
            killProofIssuerCapId,
            clockId,
            indexerApiUrl: raw.VITE_INDEXER_API_URL,
            indexerWsUrl: raw.VITE_INDEXER_WS_URL,
            indexerHealthTimeoutMs: timeout,
            localnetUrl: raw.VITE_LOCALNET_URL,
        };
    return {
        isValid: errors.length === 0,
        errors,
        raw,
        config,
    };
}
export function formatFrontendConfigDiagnostics(diagnostics) {
    const header = diagnostics.isValid
        ? 'Frontend config is valid.'
        : 'Frontend config is invalid.';
    return [header, ...diagnostics.errors].join(' ');
}
