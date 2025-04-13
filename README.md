# Orange ID Template

## Quick Start

Just click "Run" in Replit to start the application. No setup required!

> **Important**: You must set up Orange ID authentication by following these steps:
1. Visit [https://vibecodinglist.com/orange-id-integration](https://vibecodinglist.com/orange-id-integration)
2. Generate a unique Project ID (or use an existing one)
3. Whitelist your application URLs (both development and production)
4. Copy your Project ID and replace the `tenantId` value in `client/src/components/OrangeAuthProvider.tsx` with your own Project ID.
The authentication will not work unless you update the `tenantId` with your own Project ID from the Orange ID Dashboard.

### Features at a Glance

- **Zero Configuration**: Pre-configured SQLite database ready to use
- **Authentication**: Login/logout with OrangeID (Bedrock Passport)
- **Admin Dashboard**: User management and analytics
- **Auto-Admin**: First user to login becomes admin automatically
- **Modern UI**: Dark theme with orange accents
- **Production-Ready**: SQLite for both data and session storage

## How to Use This Template

1. **Start the App**: Click "Run" in Replit
2. **Login**: First user becomes admin automatically
3. **Build Your App**: Replace home page with your application features

## Customizing Your App

### Replace the Home Page

Edit `client/src/pages/home.tsx` to add your app's main functionality.

### Add Your Database Fields

Extend the user model in `shared/schema.ts` if needed.

### Create New Pages

Add pages in `client/src/pages` and register them in `client/src/App.tsx`.

### Customize Login Panel

Edit the `defaultSettings` object in `client/src/components/login-dialog.tsx` to customize the login panel appearance.

## Technical Stack

- **Frontend**: React (TypeScript), Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express.js with SQLite-based session management
- **Database**: SQLite with Drizzle ORM for persistence
- **Auth**: OrangeID (via Bedrock Passport)

## User Schema

Basic user model with:
- ID (auto-generated)
- Orange ID (unique identifier from Bedrock Passport)
- Username
- Email (optional)
- Role
- Admin status
- Creation date

## Main API Endpoints

- `POST /api/users`: Create or update users
- `GET /api/users/check-admin`: Check admin status
- `GET /api/admin/users`: Get all users (admin only)
- `GET /api/admin/stats/user-growth`: User growth stats (admin only)
- `PATCH /api/admin/users/:id/toggle-admin`: Toggle admin status (admin only)

## File Structure

- `/client/src`: React frontend
  - `/components`: UI components including login dialog
  - `/pages`: Page components (home, admin, etc.)
  - `/hooks`: Custom React hooks
- `/server`: Express backend
  - `/routes.ts`: API endpoints
  - `/storage.ts`: Database access layer
  - `/db.ts`: SQLite database connection
- `/shared`: Shared code between frontend and backend
  - `/schema.ts`: Database schema
- `/data`: SQLite database storage
  - `orange_auth.db`: Main application database
  - `sessions.db`: Session storage (in production)

## Example: Building a Quiz Game

```
I want to build a multiplayer quiz game using the Orange Auth Template with:
- Quiz creation for registered users
- Public quiz catalog
- Leaderboard for each quiz

Replace the home page with the quiz catalog and extend the admin dashboard 
to include quiz management features.
```

## Example: Task Manager

```
I want to build a task management app using the Orange Auth Template with:
- Task creation with priority and deadlines
- Team management features
- Task filtering and sorting
- Dashboard with productivity stats

Replace the home page with the task dashboard and extend the user schema 
to include team memberships.
```
