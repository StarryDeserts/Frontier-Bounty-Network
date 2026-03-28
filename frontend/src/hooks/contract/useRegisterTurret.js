import { useMutation } from '@tanstack/react-query';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { suiService } from '@/services/sui.service';
export function useRegisterTurret() {
    const signer = useSignAndExecuteTransaction();
    return useMutation({
        mutationFn: async (input) => {
            const tx = suiService.buildRegisterTurretTx(input.minThreshold, input.shareKills, input.sharePct);
            return signer.mutateAsync({ transaction: tx });
        },
    });
}
