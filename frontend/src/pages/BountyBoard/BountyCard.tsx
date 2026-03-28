import { WantedPoster } from '@/components/bounty/WantedPoster';
import type { Bounty } from '@/types/bounty';

export default function BountyCard({ bounty }: { bounty: Bounty }) {
  return <WantedPoster bounty={bounty} />;
}
