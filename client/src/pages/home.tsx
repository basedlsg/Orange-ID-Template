import { useBedrockPassport } from "@bedrock_org/passport";
import { Helmet } from "react-helmet";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { LoginDialog } from "@/components/login-dialog";

export default function Home() {
  const { isLoggedIn, user } = useBedrockPassport();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const { toast } = useToast();
  const [location] = useLocation();

  // Check if the user is an admin with caching
  useEffect(() => {
    if (isLoggedIn && user) {
      let isMounted = true;
      
      // Extract the orange ID from the user object
      // @ts-ignore - type is too complex to handle directly
      const orangeId = (user as any).sub || (user as any).id;
      if (!orangeId) {
        setIsAdmin(false);
        return;
      }
      
      // Check for cached admin status for this user
      const cachedAdminStatus = sessionStorage.getItem(`adminStatus-${orangeId}`);
      if (cachedAdminStatus !== null) {
        setIsAdmin(cachedAdminStatus === 'true');
        return;
      }
      
      // If not cached, fetch from server
      fetch(`/api/users/check-admin?orangeId=${orangeId}`)
        .then((response) => response.json())
        .then((data) => {
          if (isMounted) {
            const isUserAdmin = data.isAdmin || false;
            setIsAdmin(isUserAdmin);
            // Cache the result
            sessionStorage.setItem(`adminStatus-${orangeId}`, isUserAdmin.toString());
          }
        })
        .catch((error) => {
          console.error("Error checking admin status:", error);
          if (isMounted) {
            setIsAdmin(false);
          }
        });
        
      return () => {
        isMounted = false;
      };
    } else {
      setIsAdmin(false);
    }
  }, [isLoggedIn, user]);

  return (
    <>
      <div className="min-h-screen bg-black text-gray-100">
        <Helmet>
          <title>Spiritual Astrology Portal</title>
          <meta
            name="description"
            content="Explore your astrological profile and engage in spiritual discussions based on cosmic alignments."
          />
          <link rel="canonical" href={window.location.href} />
        </Helmet>

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-6 text-[#F37920]">
                Spiritual Astrology Portal
              </h1>
              <p className="text-xl mb-4 text-gray-300">
                Explore your astrological profile and engage in spiritual discussions based on cosmic alignments
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
                      <p className="text-gray-300 mb-2">
                        <span className="font-semibold text-white">Admin:</span>{" "}
                        {isAdmin ? "Yes" : "No"}
                      </p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded shadow-sm">
                      <p className="text-sm text-gray-400">
                        This user data is stored securely in your SQLite database.
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
                <p className="text-gray-300 mb-4">
                  Click the{" "}
                  <span className="px-2 py-1 bg-gray-800 rounded text-[#F37920] font-semibold">
                    Login
                  </span>{" "}
                  button in the top-right corner to authenticate with Orange ID.
                </p>
                <div className="p-4 bg-gray-800 rounded-md text-sm my-4">
                  <h4 className="font-semibold text-[#F37920] mb-2">🌟 First User Admin Feature</h4>
                  <p className="text-gray-300">
                    The first user to log into a fresh installation will automatically become an administrator.
                    This allows the template owner immediate access to all features.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="bg-gray-900 shadow rounded-lg p-6 border border-gray-800">
                <h3 className="text-xl font-semibold mb-3 text-[#F37920]">
                  Astrological Features
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-[#F37920] mr-2">✓</span>
                    <span className="text-gray-300">
                      Birth data collection with precise location and time
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#F37920] mr-2">✓</span>
                    <span className="text-gray-300">
                      Comprehensive natal chart generation
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#F37920] mr-2">✓</span>
                    <span className="text-gray-300">
                      Insights into zodiac signs, planetary alignments, and aspects
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#F37920] mr-2">✓</span>
                    <span className="text-gray-300">
                      Spiritual discussions with Kabbalistic elements
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#F37920] mr-2">✓</span>
                    <span className="text-gray-300">
                      User-specific astrological profiles with historical data
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-900 shadow rounded-lg p-6 border border-gray-800">
                <h3 className="text-xl font-semibold mb-3 text-[#F37920]">
                  How to Get Started
                </h3>
                <ol className="space-y-2 list-decimal pl-5">
                  <li className="text-gray-300">
                    Log in using the Orange ID integration in the top-right corner
                  </li>
                  <li className="text-gray-300">
                    Navigate to the <span className="font-semibold text-[#F37920]">Birth Data</span> page and enter your birth information:
                    <ul className="list-disc pl-6 mt-2 space-y-1 text-xs">
                      <li>Birth date (required for accurate chart generation)</li>
                      <li>Birth time (for more precise astrological insights)</li>
                      <li>Birth location (enhances planetary calculations)</li>
                    </ul>
                  </li>
                  <li className="text-gray-300">
                    View your <span className="font-semibold text-[#F37920]">Natal Chart</span> to discover your astrological profile
                  </li>
                  <li className="text-gray-300">
                    Engage in <span className="font-semibold text-[#F37920]">Spiritual Discussions</span> based on your cosmic alignments
                  </li>
                  <li className="text-gray-300">
                    Connect with Kabbalistic wisdom and astrological insights for a deeper understanding
                  </li>
                </ol>
              </div>
            </div>

            <div className="bg-gray-900 shadow rounded-lg p-6 border border-gray-800 mb-8">
              <h3 className="text-xl font-semibold mb-3 text-[#F37920]">
                Astrological Data Security
              </h3>
              <p className="text-gray-300 mb-4">
                Your personal birth data and spiritual insights are securely stored and accessible only to you.
                All astrological calculations are performed with precision to provide authentic cosmic insights.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-md">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-300">
                      <span className="font-semibold text-[#F37920]">
                        Persistent Storage
                      </span> for your natal charts and spiritual discussions
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-gray-800 rounded-md text-xs text-gray-300">
                  <span className="font-semibold text-[#F37920]">Astrological Accuracy:</span> The system uses precise astronomical 
                  calculations to generate authentic natal charts based on your exact birth details.
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <h3 className="text-xl font-semibold mb-3 text-[#F37920]">
                Begin Your Spiritual Journey
              </h3>
              <p className="text-gray-300 mb-4">
                Explore your cosmic profile, understand your astrological alignments, and engage in
                meaningful spiritual discussions guided by celestial influences.
              </p>
              <div className="inline-flex space-x-4">
                {isLoggedIn ? (
                  <a
                    href="/birth-data"
                    className="px-4 py-2 bg-[#F37920] text-white rounded-md hover:bg-[#D86A10] transition-colors"
                  >
                    Enter Birth Data
                  </a>
                ) : (
                  <button
                    onClick={() => setIsLoginDialogOpen(true)}
                    className="px-4 py-2 bg-[#F37920] text-white rounded-md hover:bg-[#D86A10] transition-colors"
                  >
                    Login to Begin
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <LoginDialog 
        open={isLoginDialogOpen} 
        onOpenChange={setIsLoginDialogOpen} 
      />
    </>
  );
}