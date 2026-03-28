import type { EventBus } from '../event-bus.js';
import type { EventEnvelope } from '../types.js';
import type { IndexerRepository } from '../db/repository.js';
import { asNumber, asString, nowMs } from '../utils.js';
import {
  handleBountyCancelled,
  handleBountyClaimed,
  handleBountyCreated,
  handleBountyExpired,
} from './bounty.processor.js';
import { handleBountyVerified } from './claim.processor.js';
import { handleHunterRegistered } from './hunter.processor.js';

export interface RawMoveEvent {
  type: string;
  id?: { txDigest?: string; eventSeq?: string | number };
  parsedJson?: Record<string, unknown>;
  timestampMs?: string | number;
}

const eventTimestamp = (event: RawMoveEvent): number => asNumber(event.timestampMs, nowMs());

const eventSeq = (event: RawMoveEvent): string => asString(event.id?.eventSeq ?? '0');

const envelopeFromEvent = (event: RawMoveEvent): EventEnvelope => ({
  type: event.type,
  txDigest: event.id?.txDigest ?? 'mock-tx',
  payload: event.parsedJson ?? {},
  timestampMs: eventTimestamp(event),
});

const packageIdFromEventType = (type: string): string => {
  const [packageId] = type.split('::', 1);
  return packageId ?? '0x0';
};

const applyProjection = (
  event: RawMoveEvent,
  repo: IndexerRepository,
  txDigest: string,
  timestampMs: number,
): void => {
  const payload = event.parsedJson ?? {};

  if (event.type.endsWith('::bounty_registry::BountyCreatedEvent')) {
    handleBountyCreated(repo, payload, txDigest, timestampMs);
  } else if (event.type.endsWith('::bounty_registry::BountyCancelledEvent')) {
    handleBountyCancelled(repo, payload);
  } else if (event.type.endsWith('::bounty_registry::BountyExpiredEvent')) {
    handleBountyExpired(repo, payload);
  } else if (event.type.endsWith('::bounty_registry::BountyClaimedEvent')) {
    handleBountyClaimed(repo, payload);
  } else if (event.type.endsWith('::bounty_verify::BountyVerifiedEvent')) {
    handleBountyVerified(repo, payload, txDigest, timestampMs);
  } else if (event.type.endsWith('::bounty_registry::HunterRegisteredEvent')) {
    handleHunterRegistered(repo, payload);
  }
};

export const processMoveEvent = (
  event: RawMoveEvent,
  repo: IndexerRepository,
  bus: EventBus,
): boolean => {
  const txDigest = event.id?.txDigest ?? 'mock-tx';
  const nextEventSeq = eventSeq(event);
  const timestampMs = eventTimestamp(event);
  const envelope = envelopeFromEvent(event);
  const packageId = packageIdFromEventType(event.type);

  let processed = false;

  repo.withTransaction(() => {
    processed = repo.tryMarkProcessedEvent(txDigest, nextEventSeq, event.type, timestampMs);

    if (processed) {
      applyProjection(event, repo, txDigest, timestampMs);
      repo.appendEvent(envelope);
    }

    repo.upsertEventCheckpoint({
      packageId,
      eventType: event.type,
      txDigest,
      eventSeq: nextEventSeq,
    });
  });

  if (processed) {
    bus.publish(envelope);
  }

  return processed;
};

export const withPackageType = (packageId: string, typePath: string): string => {
  if (typePath.startsWith('0x')) {
    return typePath;
  }
  return `${asString(packageId)}::${typePath}`;
};
