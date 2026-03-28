import { NavLink } from 'react-router-dom';

import { DEFAULT_NETWORK } from '@/config/constants';
import { ConfigStatusBadge } from '@/components/common/ConfigStatusBadge';
import { WalletButton } from '@/components/common/WalletButton';
import { ModeBadge } from '@/components/common/ModeBadge';
import { useDataSourceMode } from '@/hooks/query/useDataSourceMode';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/smart-gate-demo', label: 'Smart Gate Demo' },
  { to: '/bounties', label: 'Bounty Board' },
  { to: '/publish', label: 'Publish' },
  { to: '/hunters', label: 'Hunters' },
  { to: '/profile', label: 'My Profile' },
];

export function Header() {
  const mode = useDataSourceMode();

  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-void/82 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-4 md:px-6 xl:px-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="eyebrow">EVE Frontier / Sovereign Tactical Network</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div className="font-display text-2xl font-bold tracking-[0.08em] text-ice md:text-3xl">
                Frontier Bounty Network
              </div>
              {mode.data && <ModeBadge mode={mode.data.mode} />}
              <ConfigStatusBadge />
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
              Bounty infrastructure for Smart Gates, Smart Turrets, and future EVE Frontier kill-record flows.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-line/80 bg-steel/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
              {DEFAULT_NETWORK}
            </span>
            <WalletButton />
          </div>
        </div>
        <nav className="flex flex-wrap gap-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'border-frost/40 bg-frost/12 text-ice shadow-glow'
                    : 'border-line/70 bg-steel/55 text-muted hover:border-frost/20 hover:text-ice'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
