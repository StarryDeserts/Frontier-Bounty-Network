import { Transaction } from '@mysten/sui/transactions';
import { requireFrontendConfig } from '@/config/constants';
export class SuiService {
    buildCreateBountyTx(input) {
        const config = requireFrontendConfig();
        const tx = new Transaction();
        const [rewardCoin] = tx.splitCoins(tx.gas, [input.rewardAmount]);
        tx.moveCall({
            target: `${config.packageId}::bounty_registry::create_bounty`,
            arguments: [
                tx.object(config.bountyBoardId),
                rewardCoin,
                tx.pure.address(input.target),
                tx.pure.u64(input.durationHours),
                tx.pure.vector('u8', Array.from(new TextEncoder().encode(input.description))),
                tx.object(config.clockId),
            ],
        });
        return tx;
    }
    buildCancelBountyTx(input) {
        const config = requireFrontendConfig();
        const tx = new Transaction();
        tx.moveCall({
            target: `${config.packageId}::bounty_registry::cancel_bounty`,
            arguments: [
                tx.object(config.bountyBoardId),
                tx.object(input.bountyId),
                tx.object(config.clockId),
            ],
        });
        return tx;
    }
    buildClaimBountyTx(input) {
        const config = requireFrontendConfig();
        const tx = new Transaction();
        tx.moveCall({
            target: `${config.packageId}::bounty_verify::claim_bounty`,
            arguments: [
                tx.object(config.bountyBoardId),
                tx.object(input.bountyId),
                tx.object(input.killProofId),
                tx.object(config.claimRegistryId),
                tx.object(input.hunterBadgeId),
                tx.object(config.clockId),
            ],
        });
        return tx;
    }
    buildRegisterHunterTx() {
        const config = requireFrontendConfig();
        const tx = new Transaction();
        tx.moveCall({
            target: `${config.packageId}::bounty_registry::register_hunter`,
            arguments: [],
        });
        return tx;
    }
    buildRegisterTurretTx(minThreshold, shareKills, sharePct) {
        const config = requireFrontendConfig();
        const tx = new Transaction();
        tx.moveCall({
            target: `${config.packageId}::turret_bounty::register_bounty_turret`,
            arguments: [tx.pure.u64(minThreshold), tx.pure.bool(shareKills), tx.pure.u8(sharePct)],
        });
        return tx;
    }
    buildRegisterGateTx(mode, surcharge, minThreshold) {
        const config = requireFrontendConfig();
        const tx = new Transaction();
        tx.moveCall({
            target: `${config.packageId}::gate_bounty::register_bounty_gate`,
            arguments: [tx.pure.u8(mode), tx.pure.u64(surcharge), tx.pure.u64(minThreshold)],
        });
        return tx;
    }
}
export const suiService = new SuiService();
