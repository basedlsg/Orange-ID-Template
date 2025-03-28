import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { OrangeAuthProvider } from "@/components/OrangeAuthProvider";
import { useToast } from "@/hooks/use-toast";
import { useBedrockPassport } from "@bedrock_org/passport";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Plus, User, Trophy } from "lucide-react";
import { Logo } from "@/components/logo";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Submit from "@/pages/submit";
import Admin from "@/pages/admin";
import AuthCallback from "@/pages/AuthCallback";
import { LoginDialog } from "@/components/login-dialog";
import React from "react";
import Profile from "@/pages/profile";
import Project from "@/pages/project";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Advertise from "@/pages/advertise";
import Leaderboard from "@/pages/leaderboard"; // Import Leaderboard component
import Creator from "@/pages/creator"; // Add this import
import { Helmet } from "react-helmet";
import { FAQButton } from "@/components/faq-dialog";

async function storeUserInDB(user: any) {
  if (!user) {
    throw new Error("No user data provided");
  }

  const orangeId = user.sub || user.id;
  if (!orangeId) {
    throw new Error("Missing Orange ID (sub or id)");
  }

  const token = JSON.parse(localStorage.getItem("passport-token")!).state
    .accessToken;
  if (!token) throw new Error("Missing access token");

  try {
    const userData = {
      orangeId,
      username: user.name || user.displayName || orangeId,
      role: user.role || "user",
      email: user.email || "",
      authToken: token,
    };

    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to store user data");
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
      <span className="text-sm text-zinc-400 hidden sm:inline">
        Login to save favorites — more soon!
      </span>
      <Button
        variant="outline"
        onClick={handleOpenLogin}
        className="text-sm font-medium hover:text-primary"
      >
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

  // Loading state can be determined from isLoggedIn being null
  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-orange-400">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    sessionStorage.setItem("returnPath", window.location.pathname);
    return <LoginButton />;
  }

  // Check admin status only if this is an admin route
  if (requiresAdmin && user) {
    // Get the user data from our database to check admin status
    fetch(`/api/users/check-admin?orangeId=${user.id}`)
      .then((response) => response.json())
      .then((data) => {
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
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not verify admin privileges.",
        });
        setLocation("/");
      });
  }

  return <Component />;
}

function Navigation() {
  const { isLoggedIn, user, signOut } = useBedrockPassport();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

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

  const AdvertiseButton = () => (
    <Button
      variant="outline"
      onClick={() => setLocation("/advertise")}
      className="text-sm font-medium bg-orange-500 text-white hover:bg-orange-600"
    >
      Advertise in Orange Vibejam
    </Button>
  );

  return (
    <>
      <nav className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/">
            <Logo className="cursor-pointer" />
          </Link>
          <div className="ml-4 flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/leaderboard")}
              className="text-sm font-medium hover:text-primary"
            >
              <Trophy className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Leaderboard</span>
            </Button>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            {/* Hide on mobile, show on desktop */}
            <div className="hidden sm:flex items-center space-x-3">
              <FAQButton />
              <AdvertiseButton />
            </div>
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm font-medium hover:text-primary"
                  >
                    <User className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Account</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLocation("/profile")}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
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
      {/* Show on mobile only */}
      <div className="sm:hidden container mx-auto px-4 py-2 space-y-3">
        <div className="grid grid-cols-1 gap-3">
          <Button
            variant="outline"
            onClick={() => setLocation("/advertise")}
            className="w-full text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 border-orange-400"
          >
            Advertise in Orange Vibejam
          </Button>
          <FAQButton className="w-full" />
        </div>
      </div>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/submit">
        <ProtectedRoute component={Submit} />
      </Route>
      <Route path="/admin">
        <ProtectedRoute component={Admin} requiresAdmin={true} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route path="/projects/:slug" component={Project} />
      <Route path="/advertise" component={Advertise} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/creator/:handle" component={Creator} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OrangeAuthProvider>
        <Helmet>
          <title>VibeCodingList - Discover AI-Powered Coding Projects</title>
          <meta name="description" content="Browse and discover the best AI-generated coding projects. Find tools built with ChatGPT, Grok, Claude, and more." />
          
          {/* OpenGraph Meta Tags */}
          <meta property="og:title" content="VibeCodingList - Discover AI-Powered Coding Projects" />
          <meta property="og:description" content="Browse and discover the best AI-generated coding projects. Find tools built with ChatGPT, Grok, Claude, and more." />
          <meta property="og:image" content={`${window.location.origin}/og-image.png`} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:url" content={window.location.origin} />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="VibeCodingList" />
          
          {/* Twitter Card Meta Tags */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@vibecodinglist" />
          <meta name="twitter:title" content="VibeCodingList - Discover AI-Powered Coding Projects" />
          <meta name="twitter:description" content="Browse and discover the best AI-generated coding projects. Find tools built with ChatGPT, Grok, Claude, and more." />
          <meta name="twitter:image" content={`${window.location.origin}/twitter-card.png`} />
          <meta name="twitter:image:alt" content="VibeCodingList - Discover AI-Powered Coding Projects" />
          
          {/* Additional SEO Meta Tags */}
          <meta name="robots" content="index, follow" />
          <meta name="author" content="VibeCodingList" />
          <meta name="keywords" content="AI, coding projects, ChatGPT, Grok, Claude, developers, tools" />
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