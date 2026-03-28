import { DEFAULT_NETWORK } from '@/config/constants';
import { useDataSourceMode } from '@/hooks/query/useDataSourceMode';

export function Footer() {
  const mode = useDataSourceMode();

  return (
    <footer className="border-t border-line/60 bg-void/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-muted md:px-6 xl:px-8">
        <span>EVE Frontier-aligned bounty infrastructure / static-hostable tactical console</span>
        <span>
          {DEFAULT_NETWORK} / {mode.data?.mode ?? 'resolving'} / EV Vault recommended / claim live-ready, provider pending
        </span>
      </div>
    </footer>
  );
}
