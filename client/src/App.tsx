import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { OrangeAuthProvider } from "@/components/OrangeAuthProvider";
import { useToast } from "@/hooks/use-toast";
import { useBedrockPassport } from "@bedrock_org/passport";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { User as UserIcon } from "lucide-react";


// Define a type for the Bedrock user
interface BedrockUser {
  id?: string;
  sub?: string;
  name?: string;
  email?: string;
  role?: string;
  displayName?: string;
  // ...other properties
}
import { Logo } from "@/components/logo";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthCallback from "@/pages/AuthCallback";
import { LoginDialog } from "@/components/login-dialog";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Helmet } from "react-helmet";

// Store orangeId in localStorage for authentication
export function storeOrangeId(orangeId: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('orangeId', orangeId);
    console.log('Stored orangeId in localStorage:', orangeId);
  }
}

// Get orangeId from localStorage
export function getOrangeId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('orangeId');
  }
  return null;
}

async function storeUserInDB(user: any) {
  if (!user) {
    throw new Error("No user data provided");
  }

  const orangeId = user.sub || user.id;
  if (!orangeId) {
    throw new Error("Missing Orange ID (sub or id)");
  }
  
  // Store orangeId for later use
  storeOrangeId(orangeId);

  try {
    const userData = {
      orangeId,
      username: user.name || user.displayName || orangeId,
      role: user.role || "user",
      email: user.email || "",
    };

    console.log("Storing user in database:", userData);

    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Server error response:", errorData);
      throw new Error(errorData.error || "Failed to store user data");
    }

    return response.json();
  } catch (error) {
    console.error("Error storing user:", error);
    throw error;
  }
}

function StoreUserData() {
  const { isLoggedIn, user } = useBedrockPassport();
  const { toast } = useToast();

  useEffect(() => {
    if (isLoggedIn && user) {
      storeUserInDB(user).catch((err) => {
        console.error("Failed to store user:", err);
        toast({
          variant: "destructive",
          title: "Error storing user data",
          description:
            err instanceof Error ? err.message : "Please try again later",
        });
      });
    }
  }, [isLoggedIn, user, toast]);

  return null;
}

function LoginButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [location] = useLocation();

  const handleOpenLogin = () => {
    sessionStorage.setItem("returnPath", location);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[#F37920] hidden sm:inline">
        Login with Orange ID
      </span>
      <Button
        onClick={handleOpenLogin}
        className="text-sm font-medium bg-[#F37920] text-white hover:bg-[#D86A10] border-none"
      >
        <UserIcon className="h-4 w-4 mr-2" />
        Login
      </Button>
      <LoginDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}

function ProtectedRoute({
  component: Component,
  requiresAdmin = false,
}: {
  component: React.ComponentType;
  requiresAdmin?: boolean;
}) {
  const { isLoggedIn, user } = useBedrockPassport();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);

  // Check if the user is an admin when needed
  useEffect(() => {
    if (requiresAdmin && isLoggedIn && user) {
      setIsCheckingAdmin(true);
      // @ts-ignore - type is too complex to handle directly
      const orangeId = (user as any).sub || (user as any).id;
      if (!orangeId) {
        setIsAdmin(false);
        setIsCheckingAdmin(false);
        return;
      }

      console.log(`ProtectedRoute checking admin status for: ${orangeId}`);
      fetch(`/api/users/check-admin?orangeId=${orangeId}`)
        .then((response) => response.json())
        .then((data) => {
          console.log(`Admin check result:`, data);
          setIsAdmin(data.isAdmin);

          if (!data.isAdmin) {
            toast({
              variant: "destructive",
              title: "Access Denied",
              description: "You need admin privileges to access this page.",
            });
            setLocation("/");
          }
        })
        .catch((error) => {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not verify admin privileges.",
          });
          setLocation("/");
        })
        .finally(() => {
          setIsCheckingAdmin(false);
        });
    }
  }, [isLoggedIn, user, requiresAdmin, toast, setLocation]);

  // Loading state can be determined from isLoggedIn being null
  if (isLoggedIn === null || (requiresAdmin && isCheckingAdmin)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black">
        <img src="/orange_logo.png" alt="Orange Logo" className="h-12 mb-4" />
        <div className="animate-pulse text-[#F37920] font-medium">
          Loading authentication state...
        </div>
        <div className="mt-4 w-24 h-1 bg-gray-800 rounded-full relative overflow-hidden">
          <div className="absolute top-0 left-0 h-full bg-[#F37920] animate-loading"></div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    sessionStorage.setItem("returnPath", window.location.pathname);
    return <LoginButton />;
  }

  // If this is an admin route, only render the component if we've confirmed the user is an admin
  if (requiresAdmin && !isAdmin) {
    return null;
  }

  return <Component />;
}

function Navigation() {
  const { isLoggedIn, user, signOut } = useBedrockPassport();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);

  // Check if the user is an admin
  useEffect(() => {
    if (isLoggedIn && user) {
      setIsCheckingAdmin(true);
      // Extract the orange ID from the user object
      // @ts-ignore - type is too complex to handle directly
      const orangeId = (user as any).sub || (user as any).id;
      if (!orangeId) {
        setIsAdmin(false);
        setIsCheckingAdmin(false);
        return;
      }

      console.log(`Navigation checking admin status for: ${orangeId}`);
      fetch(`/api/users/check-admin?orangeId=${orangeId}`)
        .then((response) => response.json())
        .then((data) => {
          console.log(`Navigation admin check result:`, data);
          setIsAdmin(data.isAdmin);
        })
        .catch((error) => {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        })
        .finally(() => {
          setIsCheckingAdmin(false);
        });
    } else {
      setIsAdmin(null);
      setIsCheckingAdmin(false);
    }
  }, [isLoggedIn, user]);

  const handleLogout = async () => {
    try {
      await signOut?.();
      toast({
        title: "Logged out successfully",
        description: "Come back soon!",
      });
      setLocation("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error logging out",
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  return (
    <nav className="border-b border-gray-800 bg-black">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/">
          <Logo className="cursor-pointer" />
        </Link>

        {/* Navigation links */}
        <div className="mx-4 flex space-x-4">
          {isLoggedIn && (
            <>
              {/* <Link href="/birth-data">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium text-[#F37920] hover:text-white hover:bg-gray-800"
                >
                  Birth Data
                </Button>
              </Link> */}
              <Link href="/natal-chart">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium text-[#F37920] hover:text-white hover:bg-gray-800"
                >
                  Natal Chart
                </Button>
              </Link>
              <Link href="/spiritual-discussions">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium text-[#F37920] hover:text-white hover:bg-gray-800"
                >
                  Discussions
                </Button>
              </Link>
            </>
          )}
          {isLoggedIn && isAdmin && (
            <Link href="/admin">
              <Button
                variant="ghost"
                size="sm"
                className="text-sm font-medium text-[#F37920] hover:text-white hover:bg-gray-800"
              >
                Admin Dashboard
              </Button>
            </Link>
          )}
        </div>

        <div className="ml-auto flex items-center space-x-4">
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium text-[#F37920] hover:text-white hover:bg-gray-800"
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Account</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border border-gray-700 bg-black"
              >
                {/* <DropdownMenuItem
                  asChild
                  className="text-[#F37920] hover:text-white focus:text-white hover:bg-gray-800 focus:bg-gray-800"
                >
                  <Link href="/birth-data">Birth Data</Link>
                </DropdownMenuItem> */}
                <DropdownMenuItem
                  asChild
                  className="text-[#F37920] hover:text-white focus:text-white hover:bg-gray-800 focus:bg-gray-800"
                >
                  <Link href="/natal-chart">Natal Chart</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="text-[#F37920] hover:text-white focus:text-white hover:bg-gray-800 focus:bg-gray-800"
                >
                  <Link href="/spiritual-discussions">Discussions</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem
                    asChild
                    className="text-[#F37920] hover:text-white focus:text-white hover:bg-gray-800 focus:bg-gray-800"
                  >
                    <Link href="/admin">Admin Dashboard</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-[#F37920] hover:text-white focus:text-white hover:bg-gray-800 focus:bg-gray-800"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <LoginButton />
          )}
        </div>
      </div>
    </nav>
  );
}

// Lazy load the admin page to reduce initial bundle size
const AdminPage = React.lazy(() => import("@/pages/admin"));

function AdminRoute() {
  return (
    <React.Suspense
      fallback={
        <div className="container mx-auto py-12 px-4 bg-black text-white">
          <div className="flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-[#F37920] mb-4">
              Admin Dashboard
            </h2>
            <div className="animate-pulse text-[#F37920] mb-4">
              Loading dashboard resources...
            </div>
            <div className="w-32 h-1 bg-gray-800 rounded-full relative overflow-hidden">
              <div className="absolute top-0 left-0 h-full bg-[#F37920] animate-loading"></div>
            </div>
          </div>
        </div>
      }
    >
      <AdminPage />
    </React.Suspense>
  );
}

// Import our pages
import NatalChartPage from "@/pages/natal-chart";
import SpiritualDiscussionsPage from "@/pages/spiritual-discussions";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/admin" component={AdminRoute} />
      {/* Birth data page removed - now handled directly in the natal chart page */}
      <Route path="/natal-chart" component={() => <ProtectedRoute component={NatalChartPage} />} />
      <Route path="/spiritual-discussions" component={() => <ProtectedRoute component={SpiritualDiscussionsPage} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

// No data prefetcher component needed
// We've set the query client defaults in lib/queryClient.ts

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OrangeAuthProvider>
        <Helmet>
          <title>Spiritual Astrology Portal</title>
          <meta
            name="description"
            content="Explore your astrological profile with birth charts, natal patterns, and engage in spiritual discussions based on cosmic alignments."
          />

          {/* OpenGraph Meta Tags */}
          <meta property="og:title" content="Spiritual Astrology Portal" />
          <meta
            property="og:description"
            content="Explore your astrological profile with birth charts, natal patterns, and engage in spiritual discussions based on cosmic alignments."
          />
          <meta
            property="og:image"
            content={`${window.location.origin}/images/orange.png`}
          />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:url" content={window.location.origin} />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Spiritual Astrology Portal" />

          {/* Twitter Card Meta Tags */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Spiritual Astrology Portal" />
          <meta
            name="twitter:description"
            content="Explore your astrological profile with birth charts, natal patterns, and engage in spiritual discussions based on cosmic alignments."
          />
          <meta
            name="twitter:image"
            content={`${window.location.origin}/images/orange.png`}
          />
          <meta name="twitter:image:alt" content="Spiritual Astrology Portal" />

          {/* Additional SEO Meta Tags */}
          <meta name="robots" content="index, follow" />
          <meta name="author" content="Spiritual Astrology Portal" />
          <meta
            name="keywords"
            content="astrology, natal chart, birth chart, zodiac, spiritual discussions, horoscope, kabbalah, cosmic alignments, planetary positions"
          />
        </Helmet>
        <Navigation />
        <Router />
        <Toaster />
        <StoreUserData />
      </OrangeAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
