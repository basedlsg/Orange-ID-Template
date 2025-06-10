import { Express } from 'express';
import { createServer, Server } from 'http';

// Import all route modules
import authRoutes from './auth';
import adminRoutes from './admin';
import birthDataRoutes from './birthData';
import natalChartRoutes from './natalChart';
import citiesRoutes from './cities';
import spiritualDiscussionRoutes from './spiritualDiscussions';
import interpretationRoutes from './interpretations';
import exportRoutes from './export';

// Import middleware
import { errorHandler } from '../middleware/errorHandler';
import { apiLimiter } from '../middleware/rateLimiter';

export function registerRoutes(app: Express): Server {
  // Apply global rate limiting
  app.use('/api/', apiLimiter);
  
  // Register route modules
  app.use('/api', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/birth-data', birthDataRoutes);
  app.use('/api/natal-chart', natalChartRoutes);
  app.use('/api/cities', citiesRoutes);
  app.use('/api/spiritual-discussions', spiritualDiscussionRoutes);
  app.use('/api/interpretations', interpretationRoutes);
  app.use('/api/export', exportRoutes);
  
  // Global error handler (must be last)
  app.use(errorHandler);
  
  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}