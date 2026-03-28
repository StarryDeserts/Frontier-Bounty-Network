import { MIST_PER_SUI } from '@/config/constants';
export function formatSuiFromMist(mist) {
    return `${(mist / MIST_PER_SUI).toLocaleString(undefined, {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
    })} SUI`;
}
export function formatNumber(value) {
    return value.toLocaleString();
}
