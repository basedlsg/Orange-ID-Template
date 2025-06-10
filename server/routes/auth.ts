import { Router } from 'express';
import { insertUserSchema } from '@shared/schema';
import { storage } from '../storage';
import { validateBody } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { authLimiter } from '../middleware/rateLimiter';
import { optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Orange ID Template API'
  });
});

/**
 * Create or get user
 */
router.post('/users',
  authLimiter,
  validateBody(insertUserSchema),
  asyncHandler(async (req, res) => {
    const { orangeId, email, name } = req.body;

    // Check if user already exists
    let user = await storage.getUserByOrangeId(orangeId);
    
    if (!user) {
      // Create new user
      user = await storage.createUser({ orangeId, email, name });
    }

    // Update session
    if (req.session) {
      req.session.userId = user.id;
      req.session.orangeId = user.orangeId;
      req.session.isAdmin = Boolean(user.isAdmin);
    }

    res.json(user);
  })
);

/**
 * Check admin status
 */
router.get('/users/check-admin',
  optionalAuth,
  asyncHandler(async (req, res) => {
    // Check from query param first
    const orangeId = req.query.orangeId as string || req.user?.orangeId;
    
    if (!orangeId) {
      return res.status(400).json({ error: 'orangeId is required' });
    }

    const user = await storage.getUserByOrangeId(orangeId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ isAdmin: Boolean(user.isAdmin) });
  })
);

export default router;