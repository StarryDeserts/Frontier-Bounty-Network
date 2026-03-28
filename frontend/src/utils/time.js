export function formatTime(ts) {
    if (!ts)
        return '-';
    return new Date(ts).toLocaleString();
}
export function relativeRemaining(expiresAt) {
    const delta = expiresAt - Date.now();
    if (delta <= 0)
        return 'Expired';
    const hours = Math.floor(delta / 3600000);
    const mins = Math.floor((delta % 3600000) / 60000);
    return `${hours}h ${mins}m`;
}
