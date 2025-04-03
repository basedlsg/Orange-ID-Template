# OrangeID Authentication Template

A clean, simplified template application with OrangeID authentication and user database storage. It serves as a starting point for developers who want to build applications with pre-configured authentication, removing the complexity of implementing an auth system from scratch.

## Features

- **OrangeID Authentication**: Simple login/logout system using Orange ID
- **Session Management**: Secure session-based authentication using express-session
- **User Database**: PostgreSQL storage for user information
- **Clean Interface**: Minimalist UI with login button and user information display
- **Role-based Authorization**: Support for admin and regular user roles
- **Admin Dashboard**: User management and analytics for administrators
- **API Endpoints**: Pre-configured endpoints for user creation and admin status checking

## Technology Stack

- Frontend: React with TypeScript, Vite, Tailwind CSS, Shadcn UI components
- Backend: Express.js with session management
- Database: PostgreSQL with Drizzle ORM
- Authentication: OrangeID (via Bedrock Passport)
- Sessions: express-session with PostgreSQL session storage

## Getting Started

1. Clone this repository
2. Install dependencies: `npm install`
3. Set up your PostgreSQL database (the template uses the DATABASE_URL environment variable)
4. Run database migrations: `npm run db:push`
5. Start the application: `npm run dev`

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

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for signing session cookies (defaults to a placeholder in development)

## License

This template is open source and available for any use.