# AI Agent Instructions for Orange Auth Template

This document provides guidance for AI assistants to help users work with the Orange Auth Template.

## Project Overview

The Orange Auth Template is a starter template that provides:
- Authentication using OrangeID (Bedrock Passport)
- User management with database storage (PostgreSQL or SQLite)
- Session-based authentication with secure cookie storage
- Admin dashboard with user analytics
- Modern, responsive UI with dark theme and orange accents

## Common User Scenarios

### 1. Setting Up for Free Replit Users (SQLite)

When a user indicates they are a free Replit user, you should:

1. Verify or set `USE_SQLITE=true` in the `.env` file
2. Run the SQLite initialization script:
   ```bash
   npx tsx scripts/init-sqlite.ts
   ```
3. Start the application with the default workflow
4. Explain that:
   - Sample admin user has been created
   - Database file is located at `data/orange_auth.db`
   - No external database needed

### 2. Setting Up for Core (Paid) Replit Users (PostgreSQL)

When a user indicates they are a Core (paid) Replit user, you should:

1. Guide them to create a PostgreSQL database in Replit:
   - Click on the "Database" tab in Replit
   - Click "Create a PostgreSQL Database"
   - Wait for the database to be created
2. Remove `USE_SQLITE=true` from `.env` if present
3. Start the application with the default workflow
4. Verify that the database connection is working

### 3. Extending the User Schema

When a user wants to add fields to the user schema:

1. Update both the PostgreSQL and SQLite schemas in `shared/schema.ts`
2. Update the insert schema to include the new fields
3. Update any relevant components that use the user data
4. If necessary, migrate the database schema (for SQLite users, recommend re-running the init script)

### 4. Customizing the Theme

When a user wants to change the theme:

1. The primary color is `#F37920` (orange) - update all occurrences if changing the color
2. Key files to modify:
   - `theme.json` for global theme settings
   - CSS files for custom styling

## Technical Details

### Database Switching Mechanism

The template can switch between SQLite and PostgreSQL based on:
1. The `USE_SQLITE` environment variable
2. The presence of a `DATABASE_URL` environment variable
3. A runtime global variable for demonstration purposes

The database selection is determined by the `shouldUseSqlite()` function in `shared/schema.ts`.

### SQLite Configuration

SQLite database:
- File location: `data/orange_auth.db`
- Initialization script: `scripts/init-sqlite.ts`
- Default admin credentials: 
  - orangeId: 'admin123'
  - username: 'admin'
  - email: 'admin@example.com'
  - isAdmin: true

### Authentication Mechanism

Authentication flow:
1. User clicks login and authenticates with OrangeID
2. On successful authentication, user details are stored in database
3. Session is created and stored as a cookie
4. User remains logged in as long as session is valid
5. Admin status is checked against the database

## Other Important Notes

1. The template supports both PostgreSQL and SQLite with the same schema structure
2. Admin dashboard is only accessible to users with isAdmin flag set to true
3. Session state is separate from database state
4. The UI follows a dark theme with orange accent pattern for consistent branding
5. Database can be switched on-the-fly for demonstration purposes, but in production, this setting should be permanent
