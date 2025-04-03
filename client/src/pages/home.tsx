import { useBedrockPassport } from "@bedrock_org/passport";
import { Helmet } from "react-helmet";

export default function Home() {
  const { isLoggedIn, user } = useBedrockPassport();

  return (
    <div className="min-h-screen bg-black text-white">
      <Helmet>
        <title>OrangeID Authentication Template</title>
        <meta 
          name="description" 
          content="A simple authentication template using OrangeID for user management."
        />
        <link rel="canonical" href={window.location.href} />
      </Helmet>
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-6">Welcome to OrangeID Auth Template</h1>
          <p className="text-xl mb-10 text-gray-600">
            This is a simple template with OrangeID authentication ready to use.
            Login with your OrangeID to get started.
          </p>

          {isLoggedIn ? (
            <div className="bg-zinc-900 shadow-lg rounded-lg p-8 mb-8">
              <h2 className="text-2xl font-bold mb-4">You are logged in!</h2>
              <div className="bg-zinc-800 p-4 rounded-md mb-4">
                <p className="text-gray-700"><strong>Orange ID:</strong> {user?.id}</p>
                <p className="text-gray-700"><strong>Username:</strong> {user?.name}</p>
                <p className="text-gray-700"><strong>Email:</strong> {user?.email || "Not provided"}</p>
              </div>
              <p className="text-gray-600">
                This template stores your basic user information in a PostgreSQL database
                and provides the foundation for building authenticated applications.
              </p>
            </div>
          ) : (
            <div className="bg-zinc-900 shadow-lg rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-4">Authentication Ready</h2>
              <p className="text-zinc-300 mb-6">
                Click the Login button in the top-right corner to authenticate with your OrangeID.
              </p>
              <div className="bg-gray-50 p-4 rounded-md text-left">
                <h3 className="font-bold mb-2">Features included:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>OrangeID Authentication</li>
                  <li>User data storage in PostgreSQL</li>
                  <li>Session management</li>
                  <li>Role-based authorization</li>
                  <li>Secure API endpoints</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}