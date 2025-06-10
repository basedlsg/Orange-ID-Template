import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { storage } from '../storage';
import { z } from 'zod';
import { validateQuery } from '../middleware/validation';

const router = Router();

const exportFormatSchema = z.object({
  format: z.enum(['json', 'csv', 'pdf']).default('json')
});

/**
 * Export user's natal chart data
 */
router.get('/natal-chart',
  requireAuth,
  validateQuery(exportFormatSchema),
  asyncHandler(async (req, res) => {
    const { format } = req.query as z.infer<typeof exportFormatSchema>;
    const userId = req.user!.id;

    // Get user data
    const user = await storage.getUser(userId);
    const birthData = await storage.getBirthData(userId);
    const natalChart = await storage.getNatalChart(userId);

    if (!natalChart || !birthData) {
      return res.status(404).json({ error: 'No natal chart data found' });
    }

    // Parse chart data if stored as JSON string
    let chartData;
    try {
      chartData = typeof natalChart.chartData === 'string' 
        ? JSON.parse(natalChart.chartData) 
        : natalChart.chartData;
    } catch (e) {
      chartData = null;
    }

    switch (format) {
      case 'json':
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="natal-chart-${userId}-${Date.now()}.json"`);
        res.json({
          user: {
            name: user?.name,
            email: user?.email
          },
          birthData: {
            date: birthData.birthDate,
            time: birthData.birthTime,
            location: birthData.birthLocation,
            coordinates: {
              latitude: birthData.birthLatitude,
              longitude: birthData.birthLongitude
            }
          },
          natalChart: {
            sunSign: natalChart.sunSign,
            moonSign: natalChart.moonSign,
            ascendantSign: natalChart.ascendantSign,
            planets: {
              mercury: natalChart.mercurySign,
              venus: natalChart.venusSign,
              mars: natalChart.marsSign,
              jupiter: natalChart.jupiterSign,
              saturn: natalChart.saturnSign,
              uranus: natalChart.uranusSign,
              neptune: natalChart.neptuneSign,
              pluto: natalChart.plutoSign
            },
            houses: natalChart.houses,
            aspects: natalChart.aspects,
            fullChartData: chartData
          },
          generatedAt: new Date().toISOString()
        });
        break;

      case 'csv':
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="natal-chart-${userId}-${Date.now()}.csv"`);
        
        const csvRows = [
          ['Category', 'Element', 'Value'],
          ['User', 'Name', user?.name || ''],
          ['User', 'Email', user?.email || ''],
          ['Birth Data', 'Date', birthData.birthDate],
          ['Birth Data', 'Time', birthData.birthTime || ''],
          ['Birth Data', 'Location', birthData.birthLocation || ''],
          ['Birth Data', 'Latitude', birthData.birthLatitude?.toString() || ''],
          ['Birth Data', 'Longitude', birthData.birthLongitude?.toString() || ''],
          ['Natal Chart', 'Sun Sign', natalChart.sunSign || ''],
          ['Natal Chart', 'Moon Sign', natalChart.moonSign || ''],
          ['Natal Chart', 'Ascendant', natalChart.ascendantSign || ''],
          ['Natal Chart', 'Mercury', natalChart.mercurySign || ''],
          ['Natal Chart', 'Venus', natalChart.venusSign || ''],
          ['Natal Chart', 'Mars', natalChart.marsSign || ''],
          ['Natal Chart', 'Jupiter', natalChart.jupiterSign || ''],
          ['Natal Chart', 'Saturn', natalChart.saturnSign || ''],
          ['Natal Chart', 'Uranus', natalChart.uranusSign || ''],
          ['Natal Chart', 'Neptune', natalChart.neptuneSign || ''],
          ['Natal Chart', 'Pluto', natalChart.plutoSign || '']
        ];

        const csvContent = csvRows
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n');

        res.send(csvContent);
        break;

      case 'pdf':
        // For PDF, we'll return instructions since it requires additional setup
        res.status(501).json({
          error: 'PDF export is not yet implemented',
          message: 'Please use JSON or CSV format for now'
        });
        break;
    }
  })
);

/**
 * Export all user data (GDPR compliance)
 */
router.get('/user-data',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    // Gather all user data
    const user = await storage.getUser(userId);
    const birthData = await storage.getBirthData(userId);
    const natalChart = await storage.getNatalChart(userId);
    const discussions = await storage.getSpiritualDiscussions(userId);

    const exportData = {
      exportedAt: new Date().toISOString(),
      userData: {
        profile: user,
        birthData,
        natalChart,
        spiritualDiscussions: discussions
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-export-${userId}-${Date.now()}.json"`);
    res.json(exportData);
  })
);

export default router;