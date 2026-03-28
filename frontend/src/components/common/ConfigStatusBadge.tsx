import { FRONTEND_CONFIG_DIAGNOSTICS } from '@/config/constants';

export function ConfigStatusBadge() {
  if (!FRONTEND_CONFIG_DIAGNOSTICS.isValid) {
    return (
      <span className="rounded-full border border-crimson/35 bg-crimson/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-crimson">
        Config Error
      </span>
    );
  }

  return (
    <span className="rounded-full border border-mint/35 bg-mint/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-mint">
      Config OK
    </span>
  );
}
