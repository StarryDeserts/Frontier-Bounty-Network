export function formatTime(ts: number | null): string {
  if (!ts) return '-';
  return new Date(ts).toLocaleString();
}

export function relativeRemaining(expiresAt: number): string {
  const delta = expiresAt - Date.now();
  if (delta <= 0) return 'Expired';
  const hours = Math.floor(delta / 3_600_000);
  const mins = Math.floor((delta % 3_600_000) / 60_000);
  return `${hours}h ${mins}m`;
}
