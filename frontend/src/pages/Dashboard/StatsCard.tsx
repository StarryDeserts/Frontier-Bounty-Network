export default function StatsCard({
  title,
  value,
  detail,
  accent = 'text-ice',
}: {
  title: string;
  value: string | number;
  detail?: string;
  accent?: string;
}) {
  return (
    <div className="panel p-4">
      <p className="label-muted">{title}</p>
      <p className={`mt-3 text-3xl font-semibold ${accent}`}>{value}</p>
      {detail && <p className="mt-2 text-sm text-muted">{detail}</p>}
    </div>
  );
}
