import type { Bounty } from '@/types/bounty';

import BountyCard from './BountyCard';

export default function BountyList({ bounties }: { bounties: Bounty[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {bounties.map((bounty) => (
        <BountyCard key={bounty.id} bounty={bounty} />
      ))}
    </div>
  );
}
