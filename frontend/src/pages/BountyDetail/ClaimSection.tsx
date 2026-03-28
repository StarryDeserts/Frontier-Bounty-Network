import { useCurrentAccount } from '@mysten/dapp-kit';
import { useState } from 'react';

import { useClaimBounty } from '@/hooks/contract/useClaimBounty';
import type { Bounty } from '@/types/bounty';

export default function ClaimSection({ bounty }: { bounty: Bounty }) {
  const account = useCurrentAccount();
  const [killProofId, setKillProofId] = useState('');
  const [hunterBadgeId, setHunterBadgeId] = useState('');
  const { claimBounty, isPending } = useClaimBounty();

  return (
    <aside className="panel space-y-4 p-5">
      <div>
        <p className="eyebrow">Claim Interface</p>
        <h2 className="mt-2 font-display text-xl text-ink">Manual proof-assisted claim</h2>
      </div>
      <p className="text-sm leading-6 text-muted">
        Claim submission is live on-chain, but production proof issuance is still operator-assisted. You need a valid KillProof object plus a HunterBadge owned by the connected wallet.
      </p>
      <input
        value={killProofId}
        onChange={(e) => setKillProofId(e.target.value)}
        placeholder="KillProof object ID"
        className="control-input"
      />
      <input
        value={hunterBadgeId}
        onChange={(e) => setHunterBadgeId(e.target.value)}
        placeholder="HunterBadge object ID"
        className="control-input"
      />
      <button
        className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!account || !killProofId || !hunterBadgeId || isPending || bounty.status !== 0}
        onClick={() => claimBounty({ bountyId: bounty.id, killProofId, hunterBadgeId })}
      >
        {isPending ? 'Submitting claim...' : 'Submit Claim Transaction'}
      </button>
      <p className="text-xs leading-5 text-muted">
        If you do not have a proof yet, use the operator/manual issuance flow documented in the claim live plan.
      </p>
    </aside>
  );
}
