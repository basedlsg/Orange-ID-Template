import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { OrangeAuthProvider } from "@/components/OrangeAuthProvider";
import { useToast } from "@/hooks/use-toast";
import { useBedrockPassport } from "@bedrock_org/passport";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Plus, User, Trophy, Bell } from "lucide-react";
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

// Define notification type
type Notification = {
  id: number;
  userId: number;
  projectId: number;
  message: string;
  read: boolean;
  createdAt: string;
  type: string;
  fromOrangeId?: string;
};

// Notification item component for the dropdown
function NotificationItem({ 
  notification, 
  onMarkAsRead,
  onNavigate,
}: { 
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onNavigate: (projectId: number) => void;
}) {
  const handleClick = () => {
    onMarkAsRead(notification.id);
    if (notification.projectId) {
      onNavigate(notification.projectId);
    }
  };
  
  return (
    <div 
      className={`p-3 border-b last:border-0 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
      onClick={handleClick}
    >
      <div className="font-medium text-sm">{notification.message}</div>
      <div className="text-xs text-gray-400 mt-1">
        {new Date(notification.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}

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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Query for unread notification count
  const { data: unreadCount = 0, refetch: refetchUnreadCount } = useQuery({
    queryKey: ['/api/notifications/unread/count'],
    queryFn: async () => {
      if (!isLoggedIn || !user) return 0;
      
      const params = new URLSearchParams();
      if (user) params.append('orangeId', user.id);
      
      const response = await fetch(`/api/notifications/unread/count?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }
      
      const data = await response.json();
      return data.count;
    },
    enabled: !!isLoggedIn && !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Query for notification list
  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      if (!isLoggedIn || !user) return [];
      
      const params = new URLSearchParams();
      if (user) params.append('orangeId', user.id);
      
      const response = await fetch(`/api/notifications?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      return response.json();
    },
    enabled: !!isLoggedIn && !!user,
  });

  // Setup polling for notifications when logged in
  useEffect(() => {
    if (isLoggedIn && user) {
      // Initial fetch
      refetchUnreadCount();
      refetchNotifications();
      
      // Set up interval for polling
      intervalRef.current = setInterval(() => {
        refetchUnreadCount();
        refetchNotifications();
      }, 30000); // Every 30 seconds
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLoggedIn, user, refetchUnreadCount, refetchNotifications]);

  // Mark notification as read
  const markAsRead = async (id: number) => {
    try {
      const params = new URLSearchParams();
      if (user) params.append('orangeId', user.id);
      
      const response = await fetch(`/api/notifications/${id}/read?${params.toString()}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      await Promise.all([refetchUnreadCount(), refetchNotifications()]);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark notification as read',
      });
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const params = new URLSearchParams();
      if (user) params.append('orangeId', user.id);
      
      const response = await fetch(`/api/notifications/read-all?${params.toString()}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      await Promise.all([refetchUnreadCount(), refetchNotifications()]);
      
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark all notifications as read',
      });
    }
  };

  // Navigate to project when notification is clicked
  const navigateToProject = async (projectId: number) => {
    try {
      // Fetch the project to get its slug
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project details');
      }
      
      const project = await response.json();
      if (project && project.slug) {
        setLocation(`/projects/${project.slug}`);
      }
    } catch (error) {
      console.error('Error navigating to project:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to navigate to project',
      });
    }
  };

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
            <div className="hidden sm:block">
              <AdvertiseButton />
            </div>
            
            {/* Notification bell - only show when logged in */}
            {isLoggedIn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm font-medium hover:text-primary relative"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="p-2 border-b flex justify-between items-center">
                    <h3 className="font-semibold">Notifications</h3>
                    {notifications.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={markAllAsRead}
                        className="text-xs"
                      >
                        Mark all as read
                      </Button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notification: Notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={markAsRead}
                          onNavigate={navigateToProject}
                        />
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
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
        <Button
          variant="outline"
          onClick={() => setLocation("/advertise")}
          className="w-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Advertise Across Projects
        </Button>
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