import { INDEXER_WS_URL } from '@/config/constants';
class EventService {
    connect(onMessage) {
        const socket = new WebSocket(INDEXER_WS_URL);
        socket.onmessage = (msg) => {
            try {
                const parsed = JSON.parse(msg.data);
                onMessage(parsed);
            }
            catch {
                // ignore malformed payload
            }
        };
        return () => {
            socket.close();
        };
    }
    fromIndexedEvents(events) {
        return events.map((event) => ({
            type: event.eventType,
            txDigest: event.txDigest,
            payload: event.payload,
            timestampMs: event.createdAt,
        }));
    }
}
export const eventService = new EventService();
