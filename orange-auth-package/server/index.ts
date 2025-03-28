import { initializeDb } from './db';
import { createUserStorage } from './storage';
import { createAuthRoutes } from './authRoutes';
import { authMiddleware, adminMiddleware } from './authHelpers';

// Export all server-side components
export {
  initializeDb,
  createUserStorage,
  createAuthRoutes,
  authMiddleware,
  adminMiddleware
};

// Configure the auth package for the server
export function configureOrangeAuth(app: any, databaseUrl: string) {
  // Initialize the database
  const { db } = initializeDb(databaseUrl);
  
  // Create the user storage
  const userStorage = createUserStorage(db);
  
  // Register auth routes
  const authRoutes = createAuthRoutes(userStorage);
  app.use('/api', authRoutes);
  
  return {
    db,
    userStorage,
    authMiddleware: authMiddleware(userStorage),
    adminMiddleware: adminMiddleware(userStorage)
  };
}