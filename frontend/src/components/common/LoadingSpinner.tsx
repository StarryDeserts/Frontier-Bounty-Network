export function LoadingSpinner({ label = 'Loading tactical view...' }: { label?: string }) {
  return (
    <div className="panel-muted overflow-hidden p-5">
      <div className="h-1.5 w-24 rounded-full bg-frost/40" />
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="h-24 animate-pulse rounded-2xl bg-steel/70" />
        <div className="h-24 animate-pulse rounded-2xl bg-steel/70 md:col-span-2" />
      </div>
      <p className="mt-4 text-sm text-muted">{label}</p>
    </div>
  );
}
