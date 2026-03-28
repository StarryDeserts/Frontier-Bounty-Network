import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';

import { suiService, type ClaimBountyInput } from '@/services/sui.service';

export function useClaimBounty() {
  const queryClient = useQueryClient();
  const signer = useSignAndExecuteTransaction();

  const mutation = useMutation({
    mutationFn: async (input: ClaimBountyInput) => {
      const tx = suiService.buildClaimBountyTx(input);
      return signer.mutateAsync({ transaction: tx });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bounties'] }),
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] }),
      ]);
    },
  });

  return {
    claimBounty: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
