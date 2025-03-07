import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { OrangeAuthProvider } from "@/components/OrangeAuthProvider";
import { useToast } from "@/hooks/use-toast";
import { useBedrockPassport } from "@bedrock_org/passport";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Submit from "@/pages/submit";
import Admin from "@/pages/admin";
import AuthCallback from "@/pages/AuthCallback";

async function storeUserInDB(user: any) {
  if (!user) {
    throw new Error("No user data provided");
  }

  const orangeId = user.sub || user.id;
  if (!orangeId) {
    throw new Error("Missing Orange ID (sub or id)");
  }

  const token = JSON.parse(localStorage.getItem("passport-token")!).state.accessToken;
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
          description: err instanceof Error ? err.message : "Please try again later",
        });
      });
    }
  }, [isLoggedIn, user, toast]);

  return null;
}

function LoginButton() {
  const { signIn } = useBedrockPassport();
  const [location] = useLocation();

  const handleLogin = () => {
    sessionStorage.setItem("returnPath", location);
    signIn?.();
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleLogin}
      className="text-sm font-medium hover:text-primary"
    >
      Login
    </Button>
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

  if (isLoggedIn === false) {
    sessionStorage.setItem("returnPath", window.location.pathname);
    return <LoginButton />;
  }

  // Check admin status only if this is an admin route
  if (requiresAdmin && user) {
    // Get the user data from our database to check admin status
    fetch(`/api/users/check-admin?orangeId=${user.sub || user.id}`)
      .then(response => response.json())
      .then(data => {
        if (!data.isAdmin) {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You need admin privileges to access this page.",
          });
          setLocation("/");
        }
      })
      .catch(error => {
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
  const { isLoggedIn, signOut } = useBedrockPassport();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut?.();
      toast({
        title: "Logged out successfully",
        description: "Come back soon!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error logging out",
        description: error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  return (
    <nav className="border-b">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="VibeCodingList" className="h-8 w-8" />
          <span className="text-xl font-bold">
            VibeCodingList
          </span>
        </Link>
        <div className="ml-auto flex items-center space-x-4">
          {isLoggedIn ? (
            <>
              <Link href="/submit">
                <Button
                  variant="default"
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Submit Project
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="text-sm font-medium hover:text-destructive"
              >
                Logout
              </Button>
            </>
          ) : (
            <LoginButton />
          )}
        </div>
      </div>
    </nav>
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