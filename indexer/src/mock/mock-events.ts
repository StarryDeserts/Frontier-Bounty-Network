import type { RawMoveEvent } from '../processors/index.js';

const id = (txDigest: string, eventSeq: number) => ({ txDigest, eventSeq: String(eventSeq) });

export const createMockEvents = (packageId: string): RawMoveEvent[] => {
  const now = Date.now();

  return [
    {
      type: `${packageId}::bounty_registry::HunterRegisteredEvent`,
      id: id('mock-tx-1', 0),
      timestampMs: now - 60_000,
      parsedJson: {
        badge_id: '0xmock_badge_1',
        hunter: '0xc0ffee',
      },
    },
    {
      type: `${packageId}::bounty_registry::BountyCreatedEvent`,
      id: id('mock-tx-2', 0),
      timestampMs: now - 45_000,
      parsedJson: {
        bounty_id: '0xmock_bounty_1',
        creator: '0xa11ce',
        target: '0xb0b',
        reward_amount: '5000000',
        created_at: now - 45_000,
        expires_at: now + 86_400_000,
        description: 'Raided our outpost',
      },
    },
    {
      type: `${packageId}::bounty_registry::BountyCreatedEvent`,
      id: id('mock-tx-3', 0),
      timestampMs: now - 40_000,
      parsedJson: {
        bounty_id: '0xmock_bounty_2',
        creator: '0xd00d',
        target: '0xfade',
        reward_amount: '3000000',
        created_at: now - 40_000,
        expires_at: now + 172_800_000,
        description: 'Piracy report',
      },
    },
    {
      type: `${packageId}::bounty_verify::BountyVerifiedEvent`,
      id: id('mock-tx-4', 0),
      timestampMs: now - 30_000,
      parsedJson: {
        bounty_id: '0xmock_bounty_1',
        kill_proof_id: '0xmock_kill_1',
        hunter: '0xc0ffee',
        target: '0xb0b',
        reward_amount: '5000000',
        solar_system_id: 42,
        kill_digest: 'digest-1',
        claimed_at: now - 30_000,
      },
    },
    {
      type: `${packageId}::bounty_registry::BountyCancelledEvent`,
      id: id('mock-tx-5', 0),
      timestampMs: now - 10_000,
      parsedJson: {
        bounty_id: '0xmock_bounty_2',
        creator: '0xd00d',
        refund_amount: '3000000',
      },
    },
  ];
};
