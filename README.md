# 🍊 Orange Auth Template

## Quick Start

Just click "Run" in Replit to start the application. No setup required!

### Features at a Glance

- **Zero Configuration**: Pre-configured SQLite database ready to use
- **Authentication**: Login/logout with Orange ID
- **Admin Dashboard**: User management and analytics
- **Auto-Admin**: First user to login becomes admin automatically

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

## Technical Stack

- **Frontend**: React (TypeScript), Vite, Tailwind CSS
- **Backend**: Express.js with session management
- **Database**: SQLite with Drizzle ORM
- **Auth**: OrangeID (via Bedrock Passport)

## User Schema

Basic user model with:
- ID (auto-generated)
- Orange ID
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

## File Structure

- `/client/src`: React frontend
- `/server`: Express backend
- `/shared`: Shared code (database schema)
- `/data`: Pre-configured SQLite database

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
