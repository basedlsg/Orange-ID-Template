# AI Agent Instructions for Orange Auth Template

This document provides comprehensive guidance for AI assistants to help users build applications with the Orange Auth Template.

## Project Overview

The Orange Auth Template is a starter template that provides:
- Authentication using OrangeID (Bedrock Passport)
- User management with database storage (PostgreSQL or SQLite)
- Session-based authentication with secure cookie storage
- Admin dashboard with user analytics
- Modern, responsive UI with dark theme and orange accents

## Handling Comprehensive User Prompts

Users are encouraged to provide comprehensive prompts that describe their entire application. These may include:
- The application/game they want to build (e.g., quiz game, task manager)
- Specific features they want to implement
- Database preferences (SQLite for free users, PostgreSQL for paid)
- UI/UX requirements and changes to the default design
- Admin dashboard extensions or modifications

When handling these comprehensive prompts, you should:

1. **Analyze the full scope of the request** - Understand all components of what they're trying to build
2. **Develop a step-by-step implementation plan** - Create a clear execution strategy
3. **Start with database configuration** - Set up SQLite or PostgreSQL as requested
4. **Implement features in logical order** - Core functionality first, then additional features
5. **Verify each component works** - Test and confirm functionality before moving to the next feature
6. **Maintain the template's design language** - Keep the dark theme with orange accents unless requested otherwise

## Common Database Setup Scenarios

### 1. Setting Up for Free Replit Users (SQLite)

When a user indicates they are a free Replit user, you should:

1. Verify or set `USE_SQLITE=true` in the `.env` file or set as a secret in Replit
2. Run the SQLite initialization script:
   ```bash
   npx tsx scripts/init-sqlite.ts
   ```
3. Start the application with the default workflow
4. Explain that:
   - Sample admin user has been created
   - Database file is located at `data/orange_auth.db`
   - No external database needed
5. For new features requiring schema changes:
   - Update the schema in `shared/schema.ts`
   - Run the initialization script again or use Drizzle's built-in migration tools

### 2. Setting Up for Core (Paid) Replit Users (PostgreSQL)

When a user indicates they are a Core (paid) Replit user, you should:

1. Guide them to create a PostgreSQL database in Replit:
   - Click on the "Database" tab in Replit
   - Click "Create a PostgreSQL Database"
   - Wait for the database to be created
2. Remove `USE_SQLITE=true` from `.env` if present
3. Start the application with the default workflow
4. Verify that the database connection is working
5. For new features requiring schema changes:
   - Update the schema in `shared/schema.ts`
   - Push the schema changes using Drizzle's migration tools

## Implementing Common Application Types

### Games

For game implementations:

1. **Core Game Logic**:
   - Create separate components for game mechanics
   - Implement canvas-based or DOM-based rendering as appropriate
   - Build game state management (e.g., scores, levels, player status)

2. **Authentication Integration**:
   - Protect game routes/screens with authentication checks
   - Store player progress and preferences in the database
   - Ensure the login screen appears before accessing game features

3. **Leaderboards and Social Features**:
   - Add database tables for scores and achievements
   - Create leaderboard components with sorting and filtering
   - Implement multiplayer features if requested

### Web Applications

For web application implementations:

1. **Data Model Extensions**:
   - Update the schema to include application-specific tables
   - Create appropriate relationships between users and content
   - Add timestamp fields for created/updated dates as needed

2. **Core Functionality**:
   - Implement CRUD operations for application entities
   - Create intuitive forms with validation
   - Build list/detail views with filtering and sorting

3. **User Experience**:
   - Ensure responsive design for mobile/desktop
   - Maintain the template's dark theme with orange accents
   - Add loading states and error handling

## Technical Implementation Details

### Extending the User Schema

When adding fields to the user schema:

1. Update both PostgreSQL and SQLite schemas in `shared/schema.ts`:
   ```typescript
   export const pgUsers = pgTable("users", {
     // Existing fields
     newField: text("new_field"),
     // Other new fields
   });
   
   export const sqliteUsers = sqliteTable("users", {
     // Existing fields
     newField: text("new_field"),
     // Other new fields
   });
   ```

2. Update the insert schema to include the new fields:
   ```typescript
   export const insertUserSchema = createInsertSchema(users);
   ```

3. Update components that display or edit user data

4. For SQLite users, recommend re-running the init script:
   ```bash
   npx tsx scripts/init-sqlite.ts
   ```

### Authentication Protection Patterns

To protect routes or content with authentication:

1. **Protected Routes in React**:
   ```typescript
   function ProtectedRoute({ children }: { children: React.ReactNode }) {
     const { user, isLoading } = useOrangeAuth();
     const navigate = useNavigate();
     
     useEffect(() => {
       if (!isLoading && !user) {
         navigate('/login');
       }
     }, [user, isLoading, navigate]);
     
     if (isLoading) return <LoadingSpinner />;
     if (!user) return null;
     
     return <>{children}</>;
   }
   ```

2. **API Route Protection in Express**:
   ```typescript
   const requireAuth = async (req, res, next) => {
     const sessionUser = req.session.orangeId;
     if (!sessionUser) {
       return res.status(401).json({ error: 'Authentication required' });
     }
     next();
   };
   
   app.get('/api/protected-route', requireAuth, (req, res) => {
     // Handle protected route
   });
   ```

### Extending the Admin Dashboard

To extend the admin dashboard:

1. Add new API endpoints in `server/routes.ts`
2. Create new admin components in the `client/src/pages/admin.tsx` file
3. Add new charts or tables as needed
4. Ensure all admin features are protected by the admin middleware

## Common Issues and Solutions

1. **SQLite vs PostgreSQL Compatibility**:
   - Use Drizzle ORM's `sql` template to write database-agnostic queries
   - Handle date formatting differences between SQLite and PostgreSQL
   - Use the `shouldUseSqlite()` helper for conditional database logic

2. **Authentication State Management**:
   - Authentication state is managed by the OrangeAuthProvider component
   - Use the `useOrangeAuth()` hook to access user state in components
   - Session is stored in cookies and managed by Express

3. **Database Migration Issues**:
   - For SQLite users, recommend backing up data and re-running the init script
   - For PostgreSQL users, use Drizzle's migration tools to push schema changes
   - If all else fails, drop and recreate tables (with warning about data loss)

## Recommended Implementation Approaches

When implementing features based on user prompts:

1. **Start Simple** - Begin with basic functionality and enhance iteratively
2. **Use Component Libraries** - Leverage shadcn/ui components for consistent styling
3. **Keep State Management Clean** - Use React Query for server state, React context for application state
4. **Maintain Error Boundaries** - Implement robust error handling for each component
5. **Document Clearly** - Add comments for complex logic and document API endpoints

## Template Structure Reference

- `/client/src`: Frontend React application
  - `/components`: UI components including login dialog and authentication provider
  - `/pages`: Page components including home, admin, and auth callback
  - `/hooks`: Custom React hooks
  - `/lib`: Utility functions and API client setup
- `/server`: Backend Express server
  - `routes.ts`: API endpoint definitions
  - `storage.ts`: Database interface
  - `db.ts`: Database connection setup
  - `index.ts`: Server setup with session management
- `/shared/schema.ts`: Database schema definitions
- `/scripts`: Utility scripts
  - `init-sqlite.ts`: Initialize the SQLite database with tables and sample users
