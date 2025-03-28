# Orange Auth Package

A portable, reusable authentication package using Bedrock Passport (OrangeID) for easy integration into any project.

## Features

- Complete authentication solution using Bedrock Passport (OrangeID)
- Server and client components for a full-stack solution
- Database integration for storing user data
- Role-based access control
- Protected routes for React applications
- Easy setup and configuration

## Installation

```bash
npm install @bedrock/orange-auth
```

## Setup

### 1. Server Setup

First, configure your Express server with the authentication routes:

```typescript
// server.ts
import express from 'express';
import { configureOrangeAuth } from '@bedrock/orange-auth';

const app = express();
app.use(express.json());

// Configure auth with database connection
const { authMiddleware, adminMiddleware } = configureOrangeAuth(app, process.env.DATABASE_URL!);

// Use the auth middleware for protected routes
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'This is a protected endpoint' });
});

// Use the admin middleware for admin-only routes
app.get('/api/admin', adminMiddleware, (req, res) => {
  res.json({ message: 'This is an admin-only endpoint' });
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

### 2. Database Setup

Run the migration to create the necessary tables:

```typescript
// migrate.ts
import { runMigrations } from '@bedrock/orange-auth';

// Run migrations with your database URL
runMigrations(process.env.DATABASE_URL!, './migrations');
```

### 3. Client Setup

Wrap your application with the OrangeAuthProvider:

```tsx
// App.tsx
import React from 'react';
import { OrangeAuthProvider } from '@bedrock/orange-auth';

function App() {
  return (
    <OrangeAuthProvider
      baseUrl="https://bedrock-passport-server.com"
      tenantId="your-tenant-id"
      walletConnectId="your-wallet-connect-id"
    >
      {/* Your app components */}
    </OrangeAuthProvider>
  );
}
```

Create a callback page to handle authentication:

```tsx
// AuthCallbackPage.tsx
import React from 'react';
import { AuthCallback } from '@bedrock/orange-auth';
import { useNavigate } from 'your-router-library'; // e.g., React Router, Wouter

function AuthCallbackPage() {
  const navigate = useNavigate();

  return (
    <AuthCallback
      navigate={navigate}
      onSuccess={(user) => console.log('User authenticated:', user)}
      onError={(error) => console.error('Auth error:', error)}
    />
  );
}
```

Add a login button to your application:

```tsx
// LoginPage.tsx
import React from 'react';
import { LoginButton } from '@bedrock/orange-auth';
import { useLocation } from 'your-router-library'; // e.g., React Router, Wouter

function LoginPage() {
  const location = useLocation();

  return (
    <div>
      <h1>Welcome!</h1>
      <LoginButton 
        currentPath={location} 
        buttonText="Sign in with OrangeID" 
      />
    </div>
  );
}
```

Create protected routes:

```tsx
// ProtectedPage.tsx
import React from 'react';
import { ProtectedRoute } from '@bedrock/orange-auth';
import { useNavigate } from 'your-router-library'; // e.g., React Router, Wouter

const SecretComponent = () => <div>This is a protected page</div>;

function ProtectedPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Function to check admin status
  const checkAdminStatus = async (orangeId: string) => {
    const response = await fetch(`/api/users/check-admin?orangeId=${orangeId}`);
    const data = await response.json();
    return data.isAdmin;
  };

  return (
    <ProtectedRoute
      component={SecretComponent}
      requiresAdmin={false} // Set to true for admin-only routes
      currentPath={location}
      navigate={navigate}
      checkAdminStatus={checkAdminStatus}
    />
  );
}
```

## API Reference

### Server Components

- `configureOrangeAuth(app, databaseUrl)`: Configures the Express app with auth routes and returns middleware
- `authMiddleware`: Middleware for protecting routes to authenticated users only
- `adminMiddleware`: Middleware for protecting routes to admin users only
- `createUserStorage(db)`: Creates a storage instance for user operations
- `runMigrations(databaseUrl, migrationsFolder)`: Runs database migrations

### Client Components

- `OrangeAuthProvider`: Provider component for auth context
- `AuthCallback`: Component for handling OAuth callback
- `LoginButton`: Button component for initiating login
- `LoginDialog`: Dialog component for displaying login options
- `ProtectedRoute`: Component for creating protected routes
- `useStoreUser`: Hook for storing user data in the database
- `useBedrockPassport`: Hook for accessing auth state and methods

## License

MIT