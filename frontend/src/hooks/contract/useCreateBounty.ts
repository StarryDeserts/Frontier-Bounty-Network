import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';

import { suiService, type CreateBountyInput } from '@/services/sui.service';

export function useCreateBounty() {
  const queryClient = useQueryClient();
  const signer = useSignAndExecuteTransaction();

  const mutation = useMutation({
    mutationFn: async (input: CreateBountyInput) => {
      const tx = suiService.buildCreateBountyTx(input);
      return signer.mutateAsync({ transaction: tx });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bounties'] }),
        queryClient.invalidateQueries({ queryKey: ['stats'] }),
      ]);
    },
  });

  return {
    createBounty: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
