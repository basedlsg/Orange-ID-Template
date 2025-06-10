import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { requireAdmin } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Apply admin middleware to all routes
router.use(requireAdmin);

/**
 * Get all users
 */
router.get('/users',
  asyncHandler(async (req, res) => {
    const users = await storage.getAllUsers();
    
    // Ensure valid dates
    const formattedUsers = users.map(user => ({
      ...user,
      createdAt: user.createdAt && !isNaN(new Date(user.createdAt).getTime())
        ? user.createdAt
        : new Date().toISOString()
    }));
    
    res.json(formattedUsers);
  })
);

/**
 * Get user growth statistics
 */
router.get('/stats/user-growth',
  asyncHandler(async (req, res) => {
    const stats = await storage.getUsersCreatedByDay();
    res.json(stats);
  })
);

/**
 * Toggle user admin status
 */
const toggleAdminSchema = z.object({
  userId: z.number().or(z.string().transform(val => parseInt(val, 10))),
  makeAdmin: z.boolean()
});

router.post('/toggle-admin',
  validateBody(toggleAdminSchema),
  asyncHandler(async (req, res) => {
    const { userId, makeAdmin } = req.body;
    
    const updatedUser = await storage.toggleUserAdminStatus(userId, makeAdmin);
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update session if user toggled their own status
    if (req.session && req.session.userId === userId) {
      req.session.isAdmin = Boolean(updatedUser.isAdmin);
    }
    
    res.json(updatedUser);
  })
);

/**
 * Get chart cache statistics
 */
router.get('/cache-stats',
  asyncHandler(async (req, res) => {
    const { chartCache } = await import('../cache/chartCache');
    const stats = chartCache.getStats();
    res.json(stats);
  })
);

export default router;