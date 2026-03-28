import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';

import { suiService } from '@/services/sui.service';

export function useCancelBounty() {
  const queryClient = useQueryClient();
  const signer = useSignAndExecuteTransaction();

  const mutation = useMutation({
    mutationFn: async (bountyId: string) => {
      const tx = suiService.buildCancelBountyTx({ bountyId });
      return signer.mutateAsync({ transaction: tx });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bounties'] });
    },
  });

  return {
    cancelBounty: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
