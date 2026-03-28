import { EventEmitter } from 'node:events';

import type { EventEnvelope } from './types.js';

export class EventBus {
  private readonly emitter = new EventEmitter();

  publish(event: EventEnvelope): void {
    this.emitter.emit('event', event);
  }

  subscribe(handler: (event: EventEnvelope) => void): () => void {
    this.emitter.on('event', handler);
    return () => this.emitter.off('event', handler);
  }
}
