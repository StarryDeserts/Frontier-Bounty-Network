import type { Router } from 'express';

import type { IndexerRepository } from '../../db/repository.js';
import { asNumber } from '../../utils.js';

export const registerClaimRoutes = (router: Router, repo: IndexerRepository): void => {
  router.get('/claims/recent', (req, res) => {
    const limit = asNumber(req.query.limit, 20);
    const data = repo.getRecentClaims(limit);
    res.json({ data });
  });
};
