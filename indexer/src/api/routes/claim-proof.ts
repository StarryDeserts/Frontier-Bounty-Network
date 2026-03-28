import type { Router } from 'express';

import type { ClaimProofService } from '../../claim/service.js';

export const registerClaimProofRoutes = (router: Router, claimProofService: ClaimProofService): void => {
  router.post('/claim-proof/resolve', async (req, res, next) => {
    try {
      const bountyId = typeof req.body?.bountyId === 'string' ? req.body.bountyId : '';
      const hunter = typeof req.body?.hunter === 'string' ? req.body.hunter : '';

      if (!bountyId || !hunter) {
        res.status(400).json({
          error: 'bountyId and hunter are required',
        });
        return;
      }

      const data = await claimProofService.resolve({ bountyId, hunter });
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });
};
