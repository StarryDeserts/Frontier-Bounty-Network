import { NavLink } from 'react-router-dom';

import { requireFrontendConfig } from '@/config/constants';
import { useDataSourceMode } from '@/hooks/query/useDataSourceMode';
import { shortenAddress } from '@/utils/address';

const links = [
  { to: '/', label: 'Command Overview' },
  { to: '/smart-gate-demo', label: 'Smart Gate Demo' },
  { to: '/bounties', label: 'Bounty Board' },
  { to: '/publish', label: 'Publish Contract' },
  { to: '/hunters', label: 'Hunter Intel' },
  { to: '/profile', label: 'My Profile' },
];

export function Sidebar() {
  const config = requireFrontendConfig();
  const mode = useDataSourceMode();

  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-5 xl:flex">
      <div className="panel p-4">
        <p className="eyebrow">Navigation Grid</p>
        <div className="mt-4 space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `block rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'border-frost/40 bg-frost/10 text-ice'
                    : 'border-line/70 bg-steel/55 text-muted hover:border-frost/20 hover:text-ink'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="panel p-4">
        <p className="eyebrow">Live Baseline</p>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="label-muted">Data Path</dt>
            <dd className="mt-1 font-medium text-ink">{mode.data?.mode ?? 'Resolving...'}</dd>
          </div>
          <div>
            <dt className="label-muted">Package</dt>
            <dd className="mt-1 font-mono text-xs text-ice">{shortenAddress(config.packageId, 8)}</dd>
          </div>
          <div>
            <dt className="label-muted">Bounty Board</dt>
            <dd className="mt-1 font-mono text-xs text-ice">{shortenAddress(config.bountyBoardId, 8)}</dd>
          </div>
          <div>
            <dt className="label-muted">Claim Registry</dt>
            <dd className="mt-1 font-mono text-xs text-ice">{shortenAddress(config.claimRegistryId, 8)}</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}
