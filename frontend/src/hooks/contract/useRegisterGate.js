import { useMutation } from '@tanstack/react-query';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { suiService } from '@/services/sui.service';
export function useRegisterGate() {
    const signer = useSignAndExecuteTransaction();
    return useMutation({
        mutationFn: async (input) => {
            const tx = suiService.buildRegisterGateTx(input.mode, input.surcharge, input.minThreshold);
            return signer.mutateAsync({ transaction: tx });
        },
    });
}
