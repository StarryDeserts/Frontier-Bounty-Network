import type { Router } from 'express';

import type { IndexerRepository } from '../../db/repository.js';
import { asNumber, normalizeAddress } from '../../utils.js';

export const registerHunterRoutes = (router: Router, repo: IndexerRepository): void => {
  router.get('/hunters/leaderboard', (req, res) => {
    const limit = asNumber(req.query.limit, 100);
    const data = repo.getLeaderboard(limit);
    res.json({ data });
  });

  router.get('/hunters/:address', (req, res) => {
    const data = repo.getHunter(normalizeAddress(req.params.address));
    if (!data) {
      res.status(404).json({ error: 'Hunter not found' });
      return;
    }

    res.json({ data });
  });
};
