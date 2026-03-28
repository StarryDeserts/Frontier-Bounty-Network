import { MIST_PER_SUI } from '@/config/constants';

export function formatSuiFromMist(mist: number): string {
  return `${(mist / MIST_PER_SUI).toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} SUI`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString();
}
