import { Transaction } from '@mysten/sui/transactions';

import { requireFrontendConfig } from '@/config/constants';

export interface CreateBountyInput {
  target: string;
  rewardAmount: bigint;
  durationHours: number;
  description: string;
}

export interface ClaimBountyInput {
  bountyId: string;
  killProofId: string;
  hunterBadgeId: string;
}

export interface CancelBountyInput {
  bountyId: string;
}

export class SuiService {
  buildCreateBountyTx(input: CreateBountyInput): Transaction {
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

  buildCancelBountyTx(input: CancelBountyInput): Transaction {
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

  buildClaimBountyTx(input: ClaimBountyInput): Transaction {
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

  buildRegisterHunterTx(): Transaction {
    const config = requireFrontendConfig();
    const tx = new Transaction();
    tx.moveCall({
      target: `${config.packageId}::bounty_registry::register_hunter`,
      arguments: [],
    });
    return tx;
  }

  buildRegisterTurretTx(minThreshold: bigint, shareKills: boolean, sharePct: number): Transaction {
    const config = requireFrontendConfig();
    const tx = new Transaction();
    tx.moveCall({
      target: `${config.packageId}::turret_bounty::register_bounty_turret`,
      arguments: [tx.pure.u64(minThreshold), tx.pure.bool(shareKills), tx.pure.u8(sharePct)],
    });
    return tx;
  }

  buildRegisterGateTx(mode: number, surcharge: bigint, minThreshold: bigint): Transaction {
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
