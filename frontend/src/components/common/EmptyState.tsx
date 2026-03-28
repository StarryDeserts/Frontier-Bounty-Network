export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="panel-muted p-8 text-center">
      <p className="eyebrow">Signal Gap</p>
      <h3 className="mt-3 font-display text-xl text-ink">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}
