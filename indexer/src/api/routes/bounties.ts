import type { Router } from 'express';

import type { IndexerRepository } from '../../db/repository.js';
import { asNumber, normalizeAddress } from '../../utils.js';

export const registerBountyRoutes = (router: Router, repo: IndexerRepository): void => {
  router.get('/bounties', (req, res) => {
    const status = req.query.status === undefined ? undefined : asNumber(req.query.status, 0);

    const data = repo.listBounties({
      status,
      target: typeof req.query.target === 'string' ? normalizeAddress(req.query.target) : undefined,
      creator: typeof req.query.creator === 'string' ? normalizeAddress(req.query.creator) : undefined,
      page: asNumber(req.query.page, 1),
      pageSize: asNumber(req.query.pageSize, 20),
      sortBy:
        req.query.sortBy === 'reward_amount' || req.query.sortBy === 'expires_at'
          ? req.query.sortBy
          : 'created_at',
      sortOrder: req.query.sortOrder === 'asc' ? 'asc' : 'desc',
    });

    res.json({ data });
  });

  router.get('/bounties/target/:address', (req, res) => {
    const data = repo.getBountiesByTarget(normalizeAddress(req.params.address));
    res.json({ data });
  });

  router.get('/bounties/creator/:address', (req, res) => {
    const data = repo.getBountiesByCreator(normalizeAddress(req.params.address));
    res.json({ data });
  });

  router.get('/bounties/:id', (req, res) => {
    const data = repo.getBounty(req.params.id);
    if (!data) {
      res.status(404).json({ error: 'Bounty not found' });
      return;
    }
    res.json({ data });
  });
};
