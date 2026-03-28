import type { FrontendConfigDiagnostics } from '@/config/validate';

export function ConfigErrorScreen({
  diagnostics,
}: {
  diagnostics: FrontendConfigDiagnostics;
}) {
  return (
    <div className="min-h-screen bg-void px-4 py-10 text-ink md:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="panel p-6">
          <p className="eyebrow text-crimson">Configuration Error</p>
          <h1 className="mt-3 font-display text-3xl text-ice md:text-4xl">
            Frontend build-time config is invalid
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">
            This frontend requires real `VITE_*` chain IDs at build time. The app has stopped before mounting routes so it does not silently construct transactions against invalid IDs.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <div className="panel p-6">
            <p className="eyebrow">Errors</p>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              {diagnostics.errors.map((error) => (
                <li key={error} className="rounded-2xl border border-crimson/30 bg-crimson/10 p-4 text-crimson">
                  {error}
                </li>
              ))}
            </ul>
          </div>

          <div className="panel p-6">
            <p className="eyebrow">Loaded values</p>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-line/70 bg-graphite/80">
              <table className="min-w-full text-sm">
                <tbody>
                  {Object.entries(diagnostics.raw).map(([key, value]) => (
                    <tr key={key} className="border-t border-line/50 first:border-t-0">
                      <td className="px-4 py-3 font-mono text-xs text-muted">{key}</td>
                      <td className="px-4 py-3 font-mono text-xs text-ice">{value || '(empty)'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs leading-6 text-muted">
              Fill the real values in `frontend/.env.local`, root `.env`, or your hosting platform build env before running `pnpm -C frontend build`.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
