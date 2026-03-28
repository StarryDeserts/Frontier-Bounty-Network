import { useMutation } from '@tanstack/react-query';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { suiService } from '@/services/sui.service';
export function useRegisterHunter() {
    const signer = useSignAndExecuteTransaction();
    const mutation = useMutation({
        mutationFn: async () => signer.mutateAsync({ transaction: suiService.buildRegisterHunterTx() }),
    });
    return {
        registerHunter: mutation.mutateAsync,
        isPending: mutation.isPending,
        error: mutation.error,
    };
}
