import { useEffect } from "react";
import { useLocation } from "wouter";
import { useBedrockPassport } from "@bedrock_org/passport";
import { useToast } from "@/hooks/use-toast";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { loginCallback } = useBedrockPassport();
  const { toast } = useToast();

  useEffect(() => {
    const login = async (token: string, refreshToken: string) => {
      try {
        const success = await loginCallback(token, refreshToken);
        if (success) {
          toast({
            title: "Successfully logged in",
            description: "Welcome back!",
          });
          // Get the return path from session storage, default to home if none exists
          const returnPath = sessionStorage.getItem("returnPath") || "/";
          sessionStorage.removeItem("returnPath"); // Clean up
          setLocation(returnPath);
        }
      } catch (error) {
        console.error("Login callback error:", error);
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description:
            error instanceof Error ? error.message : "Please try again",
        });
        setLocation("/");
      }
    };

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const refreshToken = params.get("refreshToken");

    if (token && refreshToken) {
      login(token, refreshToken);
    } else {
      console.error("Missing token or refreshToken in callback URL");
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: "Invalid authentication response",
      });
      setLocation("/");
    }
  }, [loginCallback, setLocation, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-blue-400">Signing in...</div>
    </div>
  );
}
