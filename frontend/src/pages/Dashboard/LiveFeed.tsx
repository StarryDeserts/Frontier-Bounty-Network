import type { IndexedEvent } from '@/types/events';
import { formatTime } from '@/utils/time';

const summarize = (event: IndexedEvent): string => {
  const label = event.eventType.split('::').slice(-1)[0] ?? event.eventType;
  const payload = event.payload;

  if (typeof payload.target === 'string') {
    return `${label} / target ${payload.target.slice(0, 10)}...`;
  }
  if (typeof payload.hunter === 'string') {
    return `${label} / hunter ${payload.hunter.slice(0, 10)}...`;
  }
  return label;
};

export default function LiveFeed({
  events,
  isDirectMode,
}: {
  events: IndexedEvent[];
  isDirectMode: boolean;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Operational Feed</p>
          <h2 className="mt-2 font-display text-xl text-ink">Recent chain activity</h2>
        </div>
        {isDirectMode && (
          <span className="rounded-full border border-amber/35 bg-amber/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber">
            direct query
          </span>
        )}
      </div>

      <ul className="mt-5 space-y-3 text-sm">
        {events.slice(0, 8).map((event) => (
          <li key={event.id} className="rounded-2xl border border-line/60 bg-steel/45 p-3">
            <p className="font-semibold text-ink">{summarize(event)}</p>
            <p className="mt-2 text-xs text-muted">{formatTime(event.createdAt)}</p>
          </li>
        ))}
        {events.length === 0 && (
          <li className="rounded-2xl border border-dashed border-line/70 bg-graphite/65 p-4 text-muted">
            No recent event signals available yet.
          </li>
        )}
      </ul>
    </div>
  );
}
