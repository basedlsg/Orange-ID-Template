import { useBedrockPassport } from "@bedrock_org/passport";
import { Helmet } from "react-helmet";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Home() {
  const { isLoggedIn, user } = useBedrockPassport();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [dbType, setDbType] = useState<string>("sqlite");
  const [isLoadingDbType, setIsLoadingDbType] = useState<boolean>(true);
  const { toast } = useToast();
  const [location] = useLocation();

  // Check URL params for database switch notifications
  useEffect(() => {
    // Parse the URL query parameters
    const params = new URLSearchParams(window.location.search);
    
    // Check for database switch success
    if (params.get('db_switched') === 'true') {
      const type = params.get('type');
      toast({
        title: "Database Configuration Updated",
        description: `Successfully switched to ${type === 'sqlite' ? 'SQLite' : 'PostgreSQL'} database. Restart the application for changes to take effect.`,
        variant: "default",
      });
      
      // Remove the query parameters without causing a page reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Check for database switch error
    if (params.get('db_error') === 'true') {
      toast({
        title: "Database Configuration Error",
        description: "Failed to switch database type. Please check the server logs for details.",
        variant: "destructive",
      });
      
      // Remove the query parameters without causing a page reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location, toast]);

  // Get current database type
  useEffect(() => {
    fetch('/api/database-type')
      .then(response => response.json())
      .then(data => {
        setDbType(data.type);
        setIsLoadingDbType(false);
      })
      .catch(error => {
        console.error("Error fetching database type:", error);
        setIsLoadingDbType(false);
      });
  }, []);

  // Check if the user is an admin
  useEffect(() => {
    if (isLoggedIn && user) {
      // Extract the orange ID from the user object
      // @ts-ignore - type is too complex to handle directly
      const orangeId = (user as any).sub || (user as any).id;
      if (!orangeId) {
        setIsAdmin(false);
        return;
      }

      fetch(`/api/users/check-admin?orangeId=${orangeId}`)
        .then((response) => response.json())
        .then((data) => {
          setIsAdmin(data.isAdmin || false);
        })
        .catch((error) => {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        });
    } else {
      setIsAdmin(false);
    }
  }, [isLoggedIn, user]);

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Helmet>
        <title>Orange Auth Template</title>
        <meta
          name="description"
          content="A simple authentication template using Orange ID for user management."
        />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-6 text-[#F37920]">
              Orange Auth Template
            </h1>
            <p className="text-xl mb-4 text-gray-300">
              A clean, ready-to-use authentication system with Orange ID
              integration
            </p>
            <div className="inline-block border-b-2 border-[#F37920] w-24 mb-8"></div>
          </div>

          {isLoggedIn ? (
            <div className="bg-gray-900 shadow-lg rounded-lg p-8 mb-12 border border-gray-800">
              <h2 className="text-2xl font-bold mb-4 text-[#F37920]">
                ✅ Successfully Logged In!
              </h2>
              <div className="bg-gray-800 p-6 rounded-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-300 mb-2">
                      <span className="font-semibold text-white">
                        Orange ID:
                      </span>{" "}
                      {(user as any)?.id || (user as any)?.sub}
                    </p>
                    <p className="text-gray-300 mb-2">
                      <span className="font-semibold text-white">
                        Username:
                      </span>{" "}
                      {(user as any)?.name || (user as any)?.displayName}
                    </p>
                    <p className="text-gray-300 mb-2">
                      <span className="font-semibold text-white">Email:</span>{" "}
                      {(user as any)?.email || "Not provided"}
                    </p>
                    <p className="text-gray-300 mb-2">
                      <span className="font-semibold text-white">Role:</span>{" "}
                      {(user as any)?.role || "standard"}
                    </p>
                  </div>
                  <div className="bg-gray-900 p-4 rounded shadow-sm">
                    <p className="text-sm text-gray-400">
                      This user data is stored securely in your database 
                      (PostgreSQL or SQLite). You can extend the user schema as needed for
                      your application.
                    </p>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="mb-6 p-4 border-l-4 border-[#F37920] bg-gray-800">
                  <p className="font-semibold text-[#F37920]">
                    Admin Access Available
                  </p>
                  <p className="text-sm text-gray-300">
                    You have admin privileges. Visit the{" "}
                    <a href="/admin" className="text-[#F37920] underline">
                      Admin Dashboard
                    </a>{" "}
                    to manage users and view analytics.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-900 shadow-lg rounded-lg p-8 mb-8 border border-gray-800">
              <h2 className="text-2xl font-bold mb-4 text-[#F37920]">
                Getting Started
              </h2>
              <p className="text-gray-300 mb-6">
                Click the{" "}
                <span className="px-2 py-1 bg-gray-800 rounded text-[#F37920] font-semibold">
                  Login
                </span>{" "}
                button in the top-right corner to authenticate with Orange ID.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gray-900 shadow rounded-lg p-6 border border-gray-800">
              <h3 className="text-xl font-semibold mb-3 text-[#F37920]">
                Features Included
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-[#F37920] mr-2">✓</span>
                  <span className="text-gray-300">
                    Orange ID Authentication with secure sessions
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#F37920] mr-2">✓</span>
                  <span className="text-gray-300">
                    Database integration (PostgreSQL or SQLite) with Drizzle ORM
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#F37920] mr-2">✓</span>
                  <span className="text-gray-300">
                    Role-based authorization system
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#F37920] mr-2">✓</span>
                  <span className="text-gray-300">
                    Admin dashboard with user management
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#F37920] mr-2">✓</span>
                  <span className="text-gray-300">
                    User growth analytics visualization
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-900 shadow rounded-lg p-6 border border-gray-800">
              <h3 className="text-xl font-semibold mb-3 text-[#F37920]">
                How to Use This Template
              </h3>
              <ol className="space-y-2 list-decimal pl-5">
                <li className="text-gray-300">
                  Clone this template as a starting point
                </li>
                <li className="text-gray-300">
                  Configure your Orange ID credentials
                </li>
                <li className="text-gray-300">
                  Extend the user schema as needed in{" "}
                  <code className="bg-gray-800 px-1 rounded text-gray-200">
                    shared/schema.ts
                  </code>
                </li>
                <li className="text-gray-300">
                  Add your application-specific routes and components
                </li>
                <li className="text-gray-300">
                  Use the{" "}
                  <code className="bg-gray-800 px-1 rounded text-gray-200">
                    isLoggedIn
                  </code>{" "}
                  and{" "}
                  <code className="bg-gray-800 px-1 rounded text-gray-200">
                    user
                  </code>{" "}
                  objects from the Orange ID provider
                </li>
              </ol>
            </div>
          </div>

          <div className="bg-gray-900 shadow rounded-lg p-6 border border-gray-800 mb-8">
            <h3 className="text-xl font-semibold mb-3 text-[#F37920]">
              Database Configuration
            </h3>
            <p className="text-gray-300 mb-4">
              This template supports both PostgreSQL (for Replit paid users) and SQLite (for free users).
              During development, the selection is session-based and non-persistent. In production, set the 
              <code className="bg-gray-800 px-1 mx-1 rounded text-gray-200">USE_SQLITE</code> 
              environment variable.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-md">
                {isLoadingDbType ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-300">Loading database configuration...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-300">
                      Currently using: <span className="font-semibold text-[#F37920]">
                        {dbType === 'sqlite' ? 'SQLite Database' : 'PostgreSQL Database'}
                      </span>
                    </span>
                  </div>
                )}
                
                <form action="/api/switch-database" method="post" className="flex flex-col items-end">
                  <input type="hidden" name="dbType" value={dbType === 'sqlite' ? 'postgres' : 'sqlite'} />
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-[#F37920] text-white rounded-md hover:bg-[#D86A10] transition-colors"
                    disabled={isLoadingDbType}
                  >
                    Switch to {dbType === 'sqlite' ? 'PostgreSQL' : 'SQLite'}
                  </button>
                  <p className="text-xs text-gray-400 mt-1">Session-only demonstration</p>
                </form>
              </div>
              
              <div className="p-4 bg-gray-800 rounded-md">
                <h4 className="text-sm font-semibold text-[#F37920] mb-2">Instructions for AI Assistant Use</h4>
                <p className="text-sm text-gray-300">
                  <span className="font-semibold">For paid Replit users:</span> The AI should configure this app to use PostgreSQL by default, which is already set up.
                </p>
                <p className="text-sm text-gray-300 mt-1">
                  <span className="font-semibold">For free Replit users:</span> The AI should modify the code to set <code className="bg-gray-700 px-1 rounded">USE_SQLITE=true</code> in the .env file to use SQLite instead.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold mb-3 text-[#F37920]">
              Developer Documentation
            </h3>
            <p className="text-gray-300 mb-4">
              For more detailed information about the template structure and how
              to extend it, check the README.md file in the project root.
            </p>
            <div className="inline-flex space-x-4">
              <a
                href="https://github.com/your-repo/orange-auth-template"
                className="px-4 py-2 bg-[#F37920] text-white rounded-md hover:bg-[#D86A10] transition-colors"
              >
                GitHub Repository
              </a>
              <a
                href="/admin"
                className="px-4 py-2 border border-[#F37920] text-[#F37920] rounded-md hover:bg-gray-700 transition-colors"
              >
                Admin Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
