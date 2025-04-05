# AI Agent Instructions for Orange Auth Template

This document provides comprehensive guidance for AI assistants to help users build applications with the Orange Auth Template.

## Project Overview

The Orange Auth Template is a starter template that provides:
- Authentication using OrangeID (Bedrock Passport)
- User management with SQLite database storage (PostgreSQL optional)
- Session-based authentication with secure cookie storage
- Admin dashboard with user analytics
- Modern, responsive UI with dark theme and orange accents

## Handling Comprehensive User Prompts

Users are encouraged to provide comprehensive prompts that describe their entire application. These may include:
- The application/game they want to build (e.g., quiz game, task manager)
- Specific features they want to implement
- UI/UX requirements and changes to the default design
- Admin dashboard extensions or modifications

When handling these comprehensive prompts, you should:

1. **Analyze the full scope of the request** - Understand all components of what they're trying to build
2. **Develop a step-by-step implementation plan** - Create a clear execution strategy
3. **Start with database initialization** - Run the setup script to initialize SQLite
4. **Implement features in logical order** - Core functionality first, then additional features
5. **Verify each component works** - Test and confirm functionality before moving to the next feature
6. **Maintain the template's design language** - Keep the dark theme with orange accents unless requested otherwise

## Database Setup Using the Unified Setup Script

The template includes a unified setup script that automatically handles database initialization. This is the recommended way to set up the database as it prevents common errors.

### Running the Setup Script

Always start with the setup script as your first step:

```bash
npx tsx scripts/setup.ts
```

This script will:
1. Create the SQLite database by default
2. Create the necessary database tables
3. Add sample admin and test users
4. Verify database connectivity
5. Provide feedback on the setup status

### Quick Setup (SQLite)

SQLite is the default and recommended database option:

1. Run the setup script:
   ```bash
   npx tsx scripts/setup.ts
   ```
2. The script will:
   - Create the SQLite database file at `data/orange_auth.db`
   - Create the necessary tables
   - Add sample admin and test users
3. Start the application with the default workflow
4. Verify login works with the sample admin credentials (shown in the script output)

No environment variables or special configuration is required for SQLite to work.

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

1. Update the schema in `shared/schema.ts`:
   ```typescript
   export const sqliteUsers = sqliteTable("users", {
     // Existing fields
     newField: text("new_field"),
     // Other new fields
   });
   
   // If supporting PostgreSQL is needed, also update:
   export const pgUsers = pgTable("users", {
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

4. After schema changes, run the setup script again:
   ```bash
   npx tsx scripts/setup.ts
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

1. **Authentication State Management**:
   - Authentication state is managed by the OrangeAuthProvider component
   - Use the `useOrangeAuth()` hook to access user state in components
   - Session is stored in cookies and managed by Express

2. **Database Migration Issues**:
   - For schema changes, run the setup script again
   - If data preservation is critical, use Drizzle's migration tools
   - If all else fails, backup your data before dropping and recreating tables

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
  - `setup.ts`: Unified database setup script

## Advanced: PostgreSQL Configuration (Optional)

If a user specifically requests PostgreSQL instead of the default SQLite:

### For Replit Core (Paid) Users

1. Guide them to create a PostgreSQL database in Replit:
   - Click on the "Database" tab in Replit
   - Click "Create a PostgreSQL Database" 
   - Wait for the database to be created

2. Run the setup script:
   ```bash
   npx tsx scripts/setup.ts
   ```

### For Users with External PostgreSQL

If a user wants to use an external PostgreSQL database:

1. Help them create a database on a service like Neon, Supabase, or ElephantSQL
2. Guide them to add the connection string as a `DATABASE_URL` secret in Replit
3. Run the setup script:
   ```bash
   npx tsx scripts/setup.ts
   ```
