import { Router } from 'express';
import { z } from 'zod';
import { like, sql, eq } from 'drizzle-orm';
import { db } from '../db';
import { cities } from '@shared/schema';
import { validateQuery } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

const searchCitiesSchema = z.object({
  query: z.string().optional(),
  q: z.string().optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
  offset: z.string().transform(Number).pipe(z.number().min(0)).default('0')
});

/**
 * Search cities with pagination
 */
router.get('/search',
  validateQuery(searchCitiesSchema),
  asyncHandler(async (req, res) => {
    const { query: queryParam, q, limit, offset } = req.query as z.infer<typeof searchCitiesSchema>;
    const searchTerm = queryParam || q;
    
    let query = db.select({
      id: cities.id,
      name: cities.name,
      country: cities.country,
      latitude: cities.latitude,
      longitude: cities.longitude,
      timezoneStr: cities.timezoneStr,
      fullName: sql<string>`${cities.name} || ', ' || ${cities.country}`
    }).from(cities);
    
    // Add search filter if query provided
    if (searchTerm) {
      query = query.where(
        like(cities.name, `${searchTerm}%`)
      ) as any;
    }
    
    // Get total count for pagination
    const countQuery = db.select({
      count: sql<number>`count(*)`
    }).from(cities);
    
    if (searchTerm) {
      countQuery.where(like(cities.name, `${searchTerm}%`));
    }
    
    const [{ count }] = await countQuery;
    
    // Get paginated results
    const results = await query
      .orderBy(cities.name)
      .limit(limit)
      .offset(offset);
    
    res.json({
      cities: results,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < count
      }
    });
  })
);

/**
 * Get city by ID
 */
router.get('/:id',
  asyncHandler(async (req, res) => {
    const cityId = parseInt(req.params.id, 10);
    
    if (isNaN(cityId)) {
      return res.status(400).json({ error: 'Invalid city ID' });
    }
    
    const [city] = await db
      .select()
      .from(cities)
      .where(eq(cities.id, cityId))
      .limit(1);
    
    if (!city) {
      return res.status(404).json({ error: 'City not found' });
    }
    
    res.json(city);
  })
);

export default router;