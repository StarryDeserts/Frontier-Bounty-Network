import { SuiClient } from '@mysten/sui/client';

import type { EventBus } from './event-bus.js';
import type { IndexerRepository } from './db/repository.js';
import type { EventCursor as PersistedEventCursor } from './types.js';
import { createMockEvents } from './mock/mock-events.js';
import { processMoveEvent, type RawMoveEvent } from './processors/index.js';

const EVENT_SUFFIXES = [
  'bounty_registry::BountyCreatedEvent',
  'bounty_registry::BountyCancelledEvent',
  'bounty_registry::BountyExpiredEvent',
  'bounty_registry::BountyClaimedEvent',
  'bounty_registry::HunterRegisteredEvent',
  'bounty_verify::BountyVerifiedEvent',
  'bounty_verify::KillProofIssuedEvent',
];

const PAGE_SIZE = 50;

type QueryEventCursor = PersistedEventCursor | null;

export class IndexerEventListener {
  private readonly cursors = new Map<string, QueryEventCursor>();
  private pollTimer: NodeJS.Timeout | null = null;
  private pollInFlight = false;
  private stopped = false;

  constructor(
    private readonly client: SuiClient,
    private readonly packageId: string,
    private readonly repo: IndexerRepository,
    private readonly bus: EventBus,
    private readonly options: {
      pollIntervalMs: number;
      forceFullBackfill: boolean;
    },
  ) {}

  async start(): Promise<void> {
    this.stopped = false;

    for (const suffix of EVENT_SUFFIXES) {
      const type = `${this.packageId}::${suffix}`;
      const cursor = this.options.forceFullBackfill ? null : this.loadCheckpointCursor(type);
      this.cursors.set(type, cursor);

      if (cursor) {
        console.log(`[listener] tracking: ${type} from checkpoint ${cursor.txDigest}#${cursor.eventSeq}`);
      } else if (this.options.forceFullBackfill) {
        console.log(`[listener] tracking: ${type} from full backfill`);
      } else {
        console.log(`[listener] tracking: ${type} from genesis (no checkpoint)`);
      }
    }

    await this.pollAll();

    this.pollTimer = setInterval(() => {
      void this.pollAll();
    }, this.options.pollIntervalMs);

    console.log(`[listener] polling started: interval=${this.options.pollIntervalMs}ms`);
  }

  async stop(): Promise<void> {
    this.stopped = true;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private loadCheckpointCursor(type: string): QueryEventCursor {
    const checkpoint = this.repo.getEventCheckpoint(this.packageId, type);
    if (!checkpoint) {
      return null;
    }

    return {
      txDigest: checkpoint.txDigest,
      eventSeq: checkpoint.eventSeq,
    };
  }

  private async pollAll(): Promise<void> {
    if (this.stopped || this.pollInFlight) {
      return;
    }

    this.pollInFlight = true;
    try {
      for (const type of this.cursors.keys()) {
        if (this.stopped) {
          break;
        }
        await this.pollType(type);
      }
    } catch (error) {
      console.error('[listener] poll failed', error);
    } finally {
      this.pollInFlight = false;
    }
  }

  private async pollType(type: string): Promise<void> {
    let cursor = this.cursors.get(type) ?? null;
    let hasNextPage = true;
    let processed = 0;

    while (!this.stopped && hasNextPage) {
      const page = await this.client.queryEvents({
        query: { MoveEventType: type },
        cursor,
        limit: PAGE_SIZE,
        order: 'ascending',
      });

      for (const event of page.data) {
        const wasProcessed = processMoveEvent(event as unknown as RawMoveEvent, this.repo, this.bus);
        cursor = {
          txDigest: event.id.txDigest,
          eventSeq: event.id.eventSeq,
        };
        if (wasProcessed) {
          processed += 1;
        }
      }

      if (page.nextCursor) {
        cursor = {
          txDigest: page.nextCursor.txDigest,
          eventSeq: page.nextCursor.eventSeq,
        };
      }

      hasNextPage = page.hasNextPage;
    }

    this.cursors.set(type, cursor);

    if (processed > 0) {
      console.log(`[listener] processed ${processed} new events for ${type}`);
    }
  }
}

export const ingestMockEvents = (
  packageId: string,
  repo: IndexerRepository,
  bus: EventBus,
): void => {
  const events = createMockEvents(packageId);
  for (const event of events) {
    processMoveEvent(event, repo, bus);
  }
};
