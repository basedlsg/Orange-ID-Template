import React, { useEffect, useState } from "react";
import { useBedrockPassport } from "@bedrock_org/passport";
import { LoginButton } from "./LoginButton";

type ProtectedRouteProps = {
  component: React.ComponentType;
  requiresAdmin?: boolean;
  // Loading component to show while checking auth status
  loadingComponent?: React.ReactNode;
  // For redirecting unauthenticated users
  currentPath: string;
  // Function to check if user is admin via API
  checkAdminStatus?: (orangeId: string) => Promise<boolean>;
  // Navigate function to redirect users
  navigate: (path: string) => void;
  // Error handler
  onError?: (error: Error) => void;
};

export function ProtectedRoute({
  component: Component,
  requiresAdmin = false,
  loadingComponent,
  currentPath,
  checkAdminStatus,
  navigate,
  onError,
}: ProtectedRouteProps) {
  const { isLoggedIn, user } = useBedrockPassport();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);

  // Effect to check admin status when required
  useEffect(() => {
    if (requiresAdmin && isLoggedIn && user && checkAdminStatus) {
      setIsCheckingAdmin(true);
      checkAdminStatus(user.id)
        .then((adminStatus) => {
          setIsAdmin(adminStatus);
          if (!adminStatus) {
            onError?.(new Error("You need admin privileges to access this page."));
            navigate("/");
          }
        })
        .catch((error) => {
          console.error("Error checking admin status:", error);
          onError?.(new Error("Could not verify admin privileges."));
          navigate("/");
        })
        .finally(() => {
          setIsCheckingAdmin(false);
        });
    }
  }, [requiresAdmin, isLoggedIn, user, checkAdminStatus, navigate, onError]);

  // Loading state can be determined from isLoggedIn being null or when checking admin
  if (isLoggedIn === null || (requiresAdmin && isCheckingAdmin)) {
    return <>{loadingComponent || <DefaultLoading />}</>;
  }

  // If not logged in, show login button
  if (!isLoggedIn) {
    // Store current path for return after login
    sessionStorage.setItem("returnPath", currentPath);
    return <LoginButton currentPath={currentPath} />;
  }

  // If admin is required but user is not admin, we'll be redirected by the effect
  if (requiresAdmin && !isAdmin && !isCheckingAdmin) {
    return <>{loadingComponent || <DefaultLoading />}</>;
  }

  // User is authenticated (and is admin if required), show the component
  return <Component />;
}

// Default loading component
function DefaultLoading() {
  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      minHeight: "100vh" 
    }}>
      <div style={{ 
        color: "#3b82f6", // A nice blue color
        animation: "pulse 1.5s infinite", 
      }}>
        Loading...
      </div>
    </div>
  );
}