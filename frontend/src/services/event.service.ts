import { INDEXER_WS_URL } from '@/config/constants';

import type { IndexedEvent } from '@/types/events';

export interface EventMessage {
  type: string;
  txDigest: string;
  payload: Record<string, unknown>;
  timestampMs: number;
}

class EventService {
  connect(onMessage: (event: EventMessage) => void): () => void {
    const socket = new WebSocket(INDEXER_WS_URL);

    socket.onmessage = (msg) => {
      try {
        const parsed = JSON.parse(msg.data as string) as EventMessage;
        onMessage(parsed);
      } catch {
        // ignore malformed payload
      }
    };

    return () => {
      socket.close();
    };
  }

  fromIndexedEvents(events: IndexedEvent[]): EventMessage[] {
    return events.map((event) => ({
      type: event.eventType,
      txDigest: event.txDigest,
      payload: event.payload,
      timestampMs: event.createdAt,
    }));
  }
}

export const eventService = new EventService();
