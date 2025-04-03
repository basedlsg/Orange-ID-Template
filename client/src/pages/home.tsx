import { useBedrockPassport } from "@bedrock_org/passport";
import { Helmet } from "react-helmet";
import { useState, useEffect } from "react";

export default function Home() {
  const { isLoggedIn, user } = useBedrockPassport();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

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
        .then(response => response.json())
        .then(data => {
          setIsAdmin(data.isAdmin || false);
        })
        .catch(error => {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        });
    } else {
      setIsAdmin(false);
    }
  }, [isLoggedIn, user]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
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
            <h1 className="text-5xl font-bold mb-6 text-orange-500">Orange Auth Template</h1>
            <p className="text-xl mb-4 text-gray-600">
              A clean, ready-to-use authentication system with Orange ID integration
            </p>
            <div className="inline-block border-b-2 border-orange-500 w-24 mb-8"></div>
          </div>

          {isLoggedIn ? (
            <div className="bg-white shadow-lg rounded-lg p-8 mb-12 border border-orange-200">
              <h2 className="text-2xl font-bold mb-4 text-orange-500">✅ Successfully Logged In!</h2>
              <div className="bg-orange-50 p-6 rounded-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-700 mb-2"><span className="font-semibold">Orange ID:</span> {(user as any)?.id || (user as any)?.sub}</p>
                    <p className="text-gray-700 mb-2"><span className="font-semibold">Username:</span> {(user as any)?.name || (user as any)?.displayName}</p>
                    <p className="text-gray-700 mb-2"><span className="font-semibold">Email:</span> {(user as any)?.email || "Not provided"}</p>
                    <p className="text-gray-700 mb-2"><span className="font-semibold">Role:</span> {(user as any)?.role || "standard"}</p>
                  </div>
                  <div className="bg-white p-4 rounded shadow-sm">
                    <p className="text-sm text-gray-500">This user data is stored securely in your PostgreSQL database. You can extend the user schema as needed for your application.</p>
                  </div>
                </div>
              </div>
              
              {isAdmin && (
                <div className="mb-6 p-4 border-l-4 border-orange-500 bg-orange-50">
                  <p className="font-semibold text-orange-600">Admin Access Available</p>
                  <p className="text-sm text-gray-600">You have admin privileges. Visit the <a href="/admin" className="text-orange-500 underline">Admin Dashboard</a> to manage users and view analytics.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white shadow-lg rounded-lg p-8 mb-8 border border-orange-200">
              <h2 className="text-2xl font-bold mb-4 text-orange-500">Getting Started</h2>
              <p className="text-gray-600 mb-6">
                Click the <span className="px-2 py-1 bg-orange-100 rounded text-orange-600 font-semibold">Login</span> button in the top-right corner to authenticate with Orange ID.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white shadow rounded-lg p-6 border border-orange-200">
              <h3 className="text-xl font-semibold mb-3 text-orange-500">Features Included</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">✓</span>
                  <span>Orange ID Authentication with secure sessions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">✓</span>
                  <span>PostgreSQL database integration with Drizzle ORM</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">✓</span>
                  <span>Role-based authorization system</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">✓</span>
                  <span>Admin dashboard with user management</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">✓</span>
                  <span>User growth analytics visualization</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6 border border-orange-200">
              <h3 className="text-xl font-semibold mb-3 text-orange-500">How to Use This Template</h3>
              <ol className="space-y-2 list-decimal pl-5">
                <li className="text-gray-700">Clone this template as a starting point</li>
                <li className="text-gray-700">Configure your Orange ID credentials</li>
                <li className="text-gray-700">Extend the user schema as needed in <code className="bg-gray-100 px-1 rounded">shared/schema.ts</code></li>
                <li className="text-gray-700">Add your application-specific routes and components</li>
                <li className="text-gray-700">Use the <code className="bg-gray-100 px-1 rounded">isLoggedIn</code> and <code className="bg-gray-100 px-1 rounded">user</code> objects from the Orange ID provider</li>
              </ol>
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold mb-3 text-orange-600">Developer Documentation</h3>
            <p className="text-gray-600 mb-4">
              For more detailed information about the template structure and how to extend it, check the README.md file in the project root.
            </p>
            <div className="inline-flex space-x-4">
              <a href="https://github.com/your-repo/orange-auth-template" className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors">
                GitHub Repository
              </a>
              <a href="/admin" className="px-4 py-2 border border-orange-500 text-orange-500 rounded-md hover:bg-orange-50 transition-colors">
                Admin Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}