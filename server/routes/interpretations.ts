import { Router } from 'express';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { interpretations } from '@shared/schema';
import { validateQuery } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

const getInterpretationSchema = z.object({
  elementType: z.string(),
  key: z.string()
});

/**
 * Get specific interpretation
 */
router.get('/',
  validateQuery(getInterpretationSchema),
  asyncHandler(async (req, res) => {
    const { elementType, key } = req.query as z.infer<typeof getInterpretationSchema>;
    
    const [interpretation] = await db
      .select()
      .from(interpretations)
      .where(
        and(
          eq(interpretations.elementType, elementType),
          eq(interpretations.key, key)
        )
      )
      .limit(1);
    
    if (!interpretation) {
      return res.status(404).json({ error: 'Interpretation not found' });
    }
    
    res.json(interpretation);
  })
);

export default router;