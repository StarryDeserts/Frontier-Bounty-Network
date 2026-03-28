const HEX_PREFIX = '0x';

export const normalizeAddress = (value: unknown): string => {
  if (typeof value !== 'string' || value.length === 0) return HEX_PREFIX;
  return value.startsWith(HEX_PREFIX) ? value.toLowerCase() : `${HEX_PREFIX}${value.toLowerCase()}`;
};

export const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  if (typeof value === 'bigint') {
    return Number(value);
  }
  return fallback;
};

export const asString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') {
    return String(value);
  }
  return fallback;
};

export const nowMs = (): number => Date.now();
