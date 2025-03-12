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
import { X, Plus, User } from "lucide-react";
import { Logo } from "@/components/logo";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Submit from "@/pages/submit";
import Admin from "@/pages/admin";
import AuthCallback from "@/pages/AuthCallback";
import { LoginDialog } from "@/components/login-dialog";
import React from "react";
import Profile from "@/pages/profile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Advertise from "@/pages/advertise";

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
  const { isLoggedIn, loading, user } = useBedrockPassport();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  if (loading) {
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
    fetch(`/api/users/check-admin?orangeId=${user.sub || user.id}`)
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
      className="text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
    >
      Advertise Across Projects
    </Button>
  );

  return (
    <>
      <nav className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/">
            <Logo className="cursor-pointer" />
          </Link>
          <div className="ml-auto flex items-center space-x-4">
            {/* Hide on mobile, show on desktop */}
            <div className="hidden sm:block">
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
      <div className="sm:hidden container mx-auto px-4 py-2">
        <AdvertiseButton />
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
      <Route path="/advertise" component={Advertise} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OrangeAuthProvider>
        <Navigation />
        <Router />
        <Toaster />
        <StoreUserData />
      </OrangeAuthProvider>
    </QueryClientProvider>
  );
}

export default App;