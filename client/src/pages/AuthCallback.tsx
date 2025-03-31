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
          
          // Check for specific feedback related return path first
          const feedbackReturnPath = sessionStorage.getItem("feedback_return_to");
          if (feedbackReturnPath) {
            // Don't remove the storage items immediately - let the components use them first
            // The individual components will clean up their own sessionStorage items after using them
            
            // Capture the values for logging
            const projectId = sessionStorage.getItem("feedback_project_id");
            const voteFeedbackId = sessionStorage.getItem("vote_feedback_id");
            const formValues = sessionStorage.getItem("feedback_form_values");
            const likeProjectId = sessionStorage.getItem("like_project_id");
            
            console.log("Auth callback redirecting with pending actions:", {
              projectId,
              voteFeedbackId,
              hasFormValues: !!formValues,
              likeProjectId,
              returnPath: feedbackReturnPath
            });
            
            // Only remove the return path since we're using it now
            sessionStorage.removeItem("feedback_return_to");
            
            // Return to the feedback page
            setLocation(feedbackReturnPath);
            return;
          }
          
          // Fall back to general return path
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
