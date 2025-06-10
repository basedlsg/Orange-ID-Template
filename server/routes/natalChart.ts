import { Router } from 'express';
import { DateTime } from 'luxon';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { cities, insertNatalChartSchema, natalChartCalculationRequestSchema } from '@shared/schema';
import { storage } from '../storage';
import { calculateNatalChart } from '../astrologyEngine';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { asyncHandler, createApiError } from '../middleware/errorHandler';
import { chartCalculationLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * Get natal chart for authenticated user
 */
router.get('/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const natalChart = await storage.getNatalChart(req.user!.id);
    res.json(natalChart || null);
  })
);

/**
 * Create or update natal chart
 */
router.post('/',
  requireAuth,
  validateBody(insertNatalChartSchema.omit({ userId: true })),
  asyncHandler(async (req, res) => {
    const chartData = {
      ...req.body,
      userId: req.user!.id
    };
    
    const natalChart = await storage.createOrUpdateNatalChart(chartData);
    res.json(natalChart);
  })
);

/**
 * Calculate natal chart
 */
router.post('/calculate',
  chartCalculationLimiter,
  validateBody(natalChartCalculationRequestSchema),
  asyncHandler(async (req, res) => {
    const { birthDate, birthTime = '12:00', cityId } = req.body;
    
    // Fetch city details
    const [city] = await db
      .select({
        latitude: cities.latitude,
        longitude: cities.longitude,
        timezoneStr: cities.timezoneStr,
        name: cities.name
      })
      .from(cities)
      .where(eq(cities.id, cityId))
      .limit(1);
    
    if (!city) {
      throw createApiError('City not found', 404);
    }
    
    // Validate city data
    if (typeof city.latitude !== 'number' || typeof city.longitude !== 'number') {
      throw createApiError(
        `City '${city.name}' has invalid coordinate data`,
        400
      );
    }
    
    if (!city.timezoneStr) {
      throw createApiError(
        `City '${city.name}' is missing timezone data`,
        400
      );
    }
    
    // Parse datetime with timezone
    const localDateTimeStr = `${birthDate}T${birthTime}`;
    const luxonDateTime = DateTime.fromISO(localDateTimeStr, { zone: city.timezoneStr });
    
    if (!luxonDateTime.isValid) {
      throw createApiError(
        `Invalid date or time: ${luxonDateTime.invalidReason} - ${luxonDateTime.invalidExplanation}`,
        400
      );
    }
    
    // Convert to UTC
    const utcDateTime = luxonDateTime.toUTC().toJSDate();
    
    // Calculate chart
    try {
      const chartData = calculateNatalChart({
        utcDateTime,
        latitude: city.latitude,
        longitude: city.longitude
      });
      
      if (!chartData) {
        throw createApiError('Chart calculation returned no data', 500);
      }
      
      res.json(chartData);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Swiss Ephemeris')) {
        throw createApiError('Ephemeris calculation error', 500, error.message);
      }
      throw error;
    }
  })
);

export default router;