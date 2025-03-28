import React, { useEffect } from "react";
import { useBedrockPassport } from "@bedrock_org/passport";

type AuthCallbackProps = {
  onSuccess?: (user: any) => void;
  onError?: (error: Error) => void;
  redirectPath?: string;
  loadingComponent?: React.ReactNode;
  // Navigation function to redirect the user
  navigate: (path: string) => void;
};

export function AuthCallback({
  onSuccess,
  onError,
  redirectPath = "/",
  loadingComponent = <DefaultLoading />,
  navigate,
}: AuthCallbackProps) {
  const { loginCallback } = useBedrockPassport();

  useEffect(() => {
    const login = async (token: string, refreshToken: string) => {
      try {
        const success = await loginCallback(token, refreshToken);
        
        if (success) {
          // Get the return path from session storage, default to specified redirectPath if none exists
          const returnPath = sessionStorage.getItem("returnPath") || redirectPath;
          sessionStorage.removeItem("returnPath"); // Clean up
          
          // Call the success callback if provided
          if (onSuccess) {
            onSuccess(success);
          }
          
          // Navigate to the return path
          navigate(returnPath);
        }
      } catch (error) {
        console.error("Login callback error:", error);
        
        // Call the error callback if provided
        if (onError && error instanceof Error) {
          onError(error);
        }
        
        // Navigate to the home page on error
        navigate(redirectPath);
      }
    };

    // Parse parameters from URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const refreshToken = params.get("refreshToken");

    if (token && refreshToken) {
      login(token, refreshToken);
    } else {
      console.error("Missing token or refreshToken in callback URL");
      if (onError) {
        onError(new Error("Invalid authentication response"));
      }
      navigate(redirectPath);
    }
  }, [loginCallback, navigate, onSuccess, onError, redirectPath]);

  return <>{loadingComponent}</>;
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
        Signing in...
      </div>
    </div>
  );
}