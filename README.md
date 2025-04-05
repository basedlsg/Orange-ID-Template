# OrangeID Authentication Template

> **Quick Start:** Click the "Use Template" button to create your own copy. After remixing, you'll find this README again in your project files.

## 🚀 Quick Start with AI

Just copy and paste one of these prompts to get started. The AI will handle everything else!

### For Free Users (SQLite)

```
I want to set up the Orange Auth Template with SQLite for my project. I'm a free Replit user.

First, run the setup script to initialize the database:
npx tsx scripts/setup.ts

Then help me build a [game/app type] with these features:
- [Feature 1]
- [Feature 2]
- [Feature 3]

Replace the home screen with [your main feature] and keep the admin dashboard as is.
Make sure users need to log in before accessing any of the game/app features.
```

### For Core Users (PostgreSQL)

```
I want to set up the Orange Auth Template with PostgreSQL for my project. I'm a Core Replit user.

Help me create a PostgreSQL database in Replit first, then run the setup script:
npx tsx scripts/setup.ts

I'd like to build a [game/app type] with these features:
- [Feature 1]
- [Feature 2]
- [Feature 3]

Replace the home page with [your main feature]. Keep the admin dashboard, but extend
it to include [custom admin feature]. Ensure users must log in to access my application.
```

### Complete Example Prompt (Game)

```
I want to build a multiplayer snake game using the Orange Auth Template. I'm a free Replit user.

My game should have:
- A classic snake game with arrow key controls
- A persistent leaderboard showing top 10 scores
- Different difficulty levels (easy, medium, hard)
- Custom snake colors based on user preference

Replace the home screen with the game canvas and menu options.
Keep the admin dashboard as is and make sure users need to log in before playing.
Set up the SQLite database and add fields to store user scores and preferences.
Add a way for admins to reset scores or ban users who use inappropriate names.

Please implement this while maintaining the dark theme with orange accents.
```

### Complete Example Prompt (Web App)

```
I want to build a to-do list application using the Orange Auth Template. I'm a Core Replit user.

My app should have:
- Task creation with title, description, due date, and priority
- Task categorization with custom categories/tags
- Task filtering and sorting options
- Task sharing between users
- Weekly productivity reports with charts

Help me create a PostgreSQL database in Replit, then set up the application.
Replace the home page with the task dashboard and ensure users must log in to see their tasks.
Extend the admin dashboard to include system-wide statistics about task completion rates.
Add the necessary database fields for tasks, categories, and sharing permissions.

Please implement this while maintaining the dark theme with orange accents.
```

---

## Detailed Documentation

A clean, simplified template application with OrangeID authentication and user database storage. It serves as a starting point for developers who want to build applications with pre-configured authentication, removing the complexity of implementing an auth system from scratch.

### Features

- **OrangeID Authentication**: Simple login/logout system using Orange ID
- **Session Management**: Secure session-based authentication using express-session
- **User Database**: Storage for user information (PostgreSQL or SQLite)
- **Clean Interface**: Minimalist UI with dark theme and orange accents
- **Role-based Authorization**: Support for admin and regular user roles
- **Admin Dashboard**: User management and analytics for administrators
- **API Endpoints**: Pre-configured endpoints for user creation and admin status checking

### Technology Stack

- Frontend: React with TypeScript, Vite, Tailwind CSS, Shadcn UI components
- Backend: Express.js with session management
- Database: PostgreSQL or SQLite with Drizzle ORM
- Authentication: OrangeID (via Bedrock Passport)
- Sessions: express-session with database storage

## Detailed Setup Guide

### Universal Setup Script

This template includes a unified setup script that automatically detects your environment and sets up the appropriate database (SQLite or PostgreSQL):

1. **Run the Setup Script**:
   ```bash
   npx tsx scripts/setup.ts
   ```

2. **The script will**:
   - Detect if SQLite or PostgreSQL should be used based on environment variables
   - Create the necessary database tables
   - Add sample admin and test users
   - Verify database connectivity
   - Display the admin credentials for logging in

### For Replit Core (Paid) Users

1. **Database Setup Using Replit PostgreSQL**:
   - Click on the "Tools" icon in the left sidebar of Replit
   - Select "Secrets" and confirm that `DATABASE_URL` is not set
   - Click on "Database" in the left sidebar
   - Click "Create a PostgreSQL Database" button
   - Wait for the database to be created (this sets up all required environment variables automatically)

2. **Run the Setup Script**:
   ```bash
   npx tsx scripts/setup.ts
   ```

3. **Start the Application**:
   - The default workflow "Start application" is already configured to run the server
   - Click "Run" in Replit to start the application
   - The application will be accessible at the web view URL

### For Free Users

If you're using a free Replit account, the recommended approach is to use SQLite:

1. **Activate SQLite Mode**:
   - Set the environment variable `USE_SQLITE` to `true`:
     1. Click on the "Tools" icon in the left sidebar of Replit
     2. Select "Secrets"
     3. Add a new secret with key `USE_SQLITE` and value `true`
   - Alternatively, you can omit DATABASE_URL entirely and SQLite will be used by default

2. **Run the Setup Script**:
   ```bash
   npx tsx scripts/setup.ts
   ```

3. **Alternative: External PostgreSQL Services**:
   - If you prefer PostgreSQL, you can use a free service like:
     - [Neon](https://neon.tech)
     - [Supabase](https://supabase.com)
     - [ElephantSQL](https://www.elephantsql.com/)
   - Create a database and add the connection string as a `DATABASE_URL` secret in Replit
   - Make sure `USE_SQLITE` is not set to `true` or remove it if present

## Building Your Application

This template is designed to be a foundation for building your own applications. After setup, you should:

1. **Replace the home page content**: The content in `client/src/pages/home.tsx` can be replaced with your application's main functionality

2. **Extend the user model**: If needed, add additional fields to the user schema in `shared/schema.ts`

3. **Add application-specific pages**: Create new pages in the `client/src/pages` directory and register them in the router in `client/src/App.tsx`

### Example Application Scenarios

#### Quiz Game Example

```
I want to build a multiplayer quiz game using the Orange Auth Template. My game should have:
- A quiz creation form for registered users to create their own quizzes
- A quiz catalog where users can browse and play quizzes created by others
- A leaderboard showing top scorers for each quiz

The application should use the existing authentication system, but replace the home page with the quiz catalog. Only logged-in users should be able to create quizzes or record scores.

I'd like to extend the admin dashboard to include quiz management features where admins can approve, edit, or remove inappropriate content.

Please help me implement this while maintaining the dark theme with orange accents.
```

#### Task Management Example

```
I want to build a team task management app using the Orange Auth Template. My app should have:
- A project dashboard showing all tasks assigned to the user
- Task creation and assignment functionality
- Team management where users can create and invite others to teams
- Task filtering and sorting by priority, due date, and status

The application should use the existing authentication system, replacing the home page with the user's dashboard. I want to extend the user schema to include team memberships.

I'd like to keep the admin dashboard but extend it to include system-wide statistics about task completion rates and team performance.

Please implement this while maintaining the dark theme with orange accents.
```

## Authentication Flow

The template uses OrangeID for authentication, which handles the user login process. After a successful login:

1. The user is redirected back to your application
2. User information is stored in the database
3. A secure session is created to maintain the user's authenticated state
4. Authentication state is managed through the BedrockPassport provider

## Database Schema

The template includes a simple user schema with the following fields:

- `id`: Auto-incrementing primary key
- `orangeId`: Unique identifier from OrangeID
- `username`: User's display name
- `email`: User's email address (optional)
- `role`: User role (default: "user")
- `isAdmin`: Boolean flag for admin privileges
- `createdAt`: Timestamp of account creation

## API Endpoints

- `POST /api/users`: Create or update a user
- `GET /api/users/check-admin`: Check if a user has admin privileges
- `GET /api/admin/users`: Get all users (admin only)
- `GET /api/admin/stats/user-growth`: Get user growth statistics (admin only)

## Admin Dashboard

The template includes a basic admin dashboard with:

- List of all registered users
- Chart showing user growth over time
- Admin-only access protection

## Customization

This template is designed as a starting point. Here are some ways to customize it:

1. Update the UI in the React components
2. Add additional fields to the user schema
3. Create new API endpoints for your application's needs
4. Implement additional authentication features
5. Extend the admin dashboard functionality

## File Structure

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
  - `setup.ts`: Unified database setup script for both SQLite and PostgreSQL

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (or SQLite path)
- `USE_SQLITE`: Set to "true" to use SQLite instead of PostgreSQL
- `SESSION_SECRET`: Secret for signing session cookies (defaults to a placeholder in development)

## License

This template is open source and available for any use.
