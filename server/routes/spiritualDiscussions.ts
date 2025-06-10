import { Router } from 'express';
import { z } from 'zod';
import { insertSpiritualDiscussionSchema } from '@shared/schema';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validation';
import { asyncHandler, createApiError } from '../middleware/errorHandler';
import { DiscussionWebSocketServer } from '../websocket/wsServer';

const router = Router();

// Apply auth to all routes
router.use(requireAuth);

// Helper to get WebSocket server
function getWSServer(): DiscussionWebSocketServer | null {
  return (global as any).wsServer || null;
}

const idParamSchema = z.object({
  id: z.string().transform(val => parseInt(val, 10))
});

/**
 * Get all discussions for authenticated user
 */
router.get('/',
  asyncHandler(async (req, res) => {
    const discussions = await storage.getSpiritualDiscussions(req.user!.id);
    res.json(discussions);
  })
);

/**
 * Get single discussion by ID
 */
router.get('/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    
    const discussion = await storage.getSpiritualDiscussionById(id);
    
    if (!discussion) {
      throw createApiError('Discussion not found', 404);
    }
    
    // Verify ownership
    if (discussion.userId !== req.user!.id) {
      throw createApiError('Access denied', 403);
    }
    
    res.json(discussion);
  })
);

/**
 * Create new discussion
 */
router.post('/',
  validateBody(insertSpiritualDiscussionSchema.omit({ userId: true })),
  asyncHandler(async (req, res) => {
    let discussionData = {
      ...req.body,
      userId: req.user!.id
    };
    
    // Check if we should enhance with AI
    const useGemini = req.query.useGemini === 'true' || req.body.useGemini === true;
    
    if (useGemini) {
      try {
        const natalChart = await storage.getNatalChart(req.user!.id);
        
        if (natalChart) {
          const { generateAstrologicalInsights } = await import('../gemini');
          const insights = await generateAstrologicalInsights(natalChart, discussionData.topic);
          
          discussionData = {
            ...discussionData,
            astrologicalContext: insights.astrologicalContext || discussionData.astrologicalContext,
            kabbalisticElements: insights.kabbalisticElements || discussionData.kabbalisticElements
          };
        }
      } catch (error) {
        console.error('Error enhancing with Gemini:', error);
        // Continue without enhancement
      }
    }
    
    const discussion = await storage.createSpiritualDiscussion(discussionData);
    
    // Broadcast WebSocket update
    const wsServer = getWSServer();
    if (wsServer) {
      wsServer.broadcastDiscussionUpdate(discussion.id, discussion, 'created');
      wsServer.broadcastUserDiscussionsUpdate(req.user!.id, discussion, 'created');
    }
    
    res.status(201).json(discussion);
  })
);

/**
 * Update discussion
 */
router.patch('/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    
    // Verify ownership
    const existing = await storage.getSpiritualDiscussionById(id);
    
    if (!existing) {
      throw createApiError('Discussion not found', 404);
    }
    
    if (existing.userId !== req.user!.id) {
      throw createApiError('Access denied', 403);
    }
    
    let updates = { ...req.body };
    
    // Check if we should enhance with AI
    const useGemini = req.query.useGemini === 'true' || req.body.useGemini === true;
    
    if (useGemini) {
      try {
        const natalChart = await storage.getNatalChart(req.user!.id);
        
        if (natalChart) {
          const { generateAstrologicalInsights } = await import('../gemini');
          const insights = await generateAstrologicalInsights(
            natalChart, 
            updates.topic || existing.topic
          );
          
          updates = {
            ...updates,
            astrologicalContext: insights.astrologicalContext || updates.astrologicalContext,
            kabbalisticElements: insights.kabbalisticElements || updates.kabbalisticElements
          };
        }
      } catch (error) {
        console.error('Error enhancing with Gemini:', error);
        // Continue without enhancement
      }
    }
    
    const updated = await storage.updateSpiritualDiscussion(id, updates);
    
    if (!updated) {
      throw createApiError('Failed to update discussion', 500);
    }
    
    // Broadcast WebSocket update
    const wsServer = getWSServer();
    if (wsServer) {
      wsServer.broadcastDiscussionUpdate(id, updated, 'updated');
      wsServer.broadcastUserDiscussionsUpdate(req.user!.id, updated, 'updated');
    }
    
    res.json(updated);
  })
);

/**
 * Delete discussion
 */
router.delete('/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    
    // Verify ownership
    const existing = await storage.getSpiritualDiscussionById(id);
    
    if (!existing) {
      throw createApiError('Discussion not found', 404);
    }
    
    if (existing.userId !== req.user!.id) {
      throw createApiError('Access denied', 403);
    }
    
    const success = await storage.deleteSpiritualDiscussion(id);
    
    if (!success) {
      throw createApiError('Failed to delete discussion', 500);
    }
    
    // Broadcast WebSocket update
    const wsServer = getWSServer();
    if (wsServer) {
      wsServer.broadcastDiscussionUpdate(id, { id }, 'deleted');
      wsServer.broadcastUserDiscussionsUpdate(req.user!.id, { id }, 'deleted');
    }
    
    res.status(204).end();
  })
);

export default router;