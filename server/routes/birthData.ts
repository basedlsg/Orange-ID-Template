import { Router } from 'express';
import { insertBirthDataSchema } from '@shared/schema';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * Get birth data for authenticated user
 */
router.get('/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const birthData = await storage.getBirthData(req.user!.id);
    
    if (!birthData) {
      return res.status(404).json({ error: 'Birth data not found' });
    }
    
    res.json(birthData);
  })
);

/**
 * Create or update birth data
 */
router.post('/',
  requireAuth,
  validateBody(insertBirthDataSchema.omit({ userId: true })),
  asyncHandler(async (req, res) => {
    const birthDataWithUserId = {
      ...req.body,
      userId: req.user!.id
    };
    
    const birthData = await storage.createOrUpdateBirthData(birthDataWithUserId);
    res.json(birthData);
  })
);

export default router;