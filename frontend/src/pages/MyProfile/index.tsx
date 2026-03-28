import { useCurrentAccount } from '@mysten/dapp-kit';

import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ModeBadge } from '@/components/common/ModeBadge';
import { useBounties } from '@/hooks/query/useBounties';
import { useDataSourceMode } from '@/hooks/query/useDataSourceMode';
import { useHunterProfile } from '@/hooks/query/useHunterProfile';
import { useRecentClaims } from '@/hooks/query/useRecentClaims';

import BadgeDisplay from './BadgeDisplay';
import MyBounties from './MyBounties';
import MyClaims from './MyClaims';
import Settings from './Settings';

export default function MyProfilePage() {
  const account = useCurrentAccount();
  const address = account?.address;
  const mode = useDataSourceMode();

  const hunter = useHunterProfile(address);
  const myBounties = useBounties({ creator: address, pageSize: 20 });
  const claims = useRecentClaims(50);

  if (!address) {
    return <EmptyState title="Connect wallet" description="Connect a wallet to inspect badge ownership, published bounties, and wallet-bound claims." />;
  }

  if (hunter.isLoading || myBounties.isLoading || claims.isLoading) {
    return <LoadingSpinner label="Loading wallet telemetry..." />;
  }

  const myClaims = (claims.data ?? []).filter((row) => row.hunter === address);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Wallet Control Profile</p>
          <h1 className="mt-2 font-display text-3xl text-ice">My Profile</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
            Core profile reads work without an indexer. In chain-direct mode, claims and rankings are derived from recent on-chain events rather than full historical aggregates.
          </p>
        </div>
        {mode.data && <ModeBadge mode={mode.data.mode} />}
      </div>

      <BadgeDisplay hunter={hunter.data ?? null} address={address} />
      <div className="grid gap-5 xl:grid-cols-2">
        <MyBounties bounties={myBounties.data ?? []} />
        <MyClaims claims={myClaims} />
      </div>
      <Settings />
    </section>
  );
}
