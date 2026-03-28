import http from 'node:http';

import cors from 'cors';
import express from 'express';
import { WebSocketServer } from 'ws';

import type { ClaimProofService } from '../claim/service.js';
import type { EventBus } from '../event-bus.js';
import type { IndexerRepository } from '../db/repository.js';
import type { EventEnvelope } from '../types.js';
import { registerBountyRoutes } from './routes/bounties.js';
import { registerClaimProofRoutes } from './routes/claim-proof.js';
import { registerClaimRoutes } from './routes/claims.js';
import { registerHunterRoutes } from './routes/hunters.js';
import { registerStatsRoutes } from './routes/stats.js';

export class ApiServer {
  private readonly app = express();
  private readonly server = http.createServer(this.app);
  private readonly wss: WebSocketServer | null;
  private unsub: (() => void) | null = null;

  constructor(
    private readonly repo: IndexerRepository,
    private readonly bus: EventBus,
    private readonly claimProofService: ClaimProofService,
    private readonly options: {
      port: number;
      corsOrigin: string;
      wsEnabled: boolean;
    },
  ) {
    this.app.use(cors({ origin: this.options.corsOrigin }));
    this.app.use(express.json());

    const api = express.Router();
    registerBountyRoutes(api, this.repo);
    registerHunterRoutes(api, this.repo);
    registerClaimRoutes(api, this.repo);
    registerClaimProofRoutes(api, this.claimProofService);
    registerStatsRoutes(api, this.repo);

    this.app.get('/health', (_req, res) => {
      res.json({ ok: true });
    });

    this.app.use('/api', api);

    if (this.options.wsEnabled) {
      this.wss = new WebSocketServer({ noServer: true });
      this.server.on('upgrade', (request, socket, head) => {
        if (request.url !== '/ws/events') {
          socket.destroy();
          return;
        }

        this.wss?.handleUpgrade(request, socket, head, (ws) => {
          this.wss?.emit('connection', ws, request);
        });
      });

      this.wss.on('connection', (ws) => {
        ws.send(
          JSON.stringify({
            type: 'system.connected',
            txDigest: 'n/a',
            payload: { message: 'connected' },
            timestampMs: Date.now(),
          }),
        );
      });

      this.unsub = this.bus.subscribe((event: EventEnvelope) => {
        const message = JSON.stringify(event);
        for (const client of this.wss?.clients ?? []) {
          if (client.readyState === client.OPEN) {
            client.send(message);
          }
        }
      });
    } else {
      this.wss = null;
    }
  }

  async start(): Promise<void> {
    await new Promise<void>((resolve) => {
      this.server.listen(this.options.port, () => resolve());
    });
  }

  async stop(): Promise<void> {
    this.unsub?.();
    this.wss?.close();
    await new Promise<void>((resolve, reject) => {
      this.server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}
