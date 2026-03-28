import type { Router } from 'express';

import type { IndexerRepository } from '../../db/repository.js';
import { asNumber } from '../../utils.js';

export const registerStatsRoutes = (router: Router, repo: IndexerRepository): void => {
  router.get('/stats', (_req, res) => {
    const data = repo.getStats();
    res.json({ data });
  });

  router.get('/events/recent', (req, res) => {
    const limit = asNumber(req.query.limit, 30);
    const data = repo.getRecentEvents(limit);
    res.json({ data });
  });
};
