import { useEffect, useState } from "react";
import { useBedrockPassport } from "@bedrock_org/passport";

type StoreUserOptions = {
  apiEndpoint?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useStoreUser({
  apiEndpoint = "/api/users",
  onSuccess,
  onError,
}: StoreUserOptions = {}) {
  const { isLoggedIn, user } = useBedrockPassport();
  const [isStoring, setIsStoring] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (isLoggedIn && user) {
      storeUserInDB();
    }
  }, [isLoggedIn, user]);

  const storeUserInDB = async () => {
    if (!user) {
      const error = new Error("No user data provided");
      setError(error);
      onError?.(error);
      return;
    }

    const orangeId = user.sub || user.id;
    if (!orangeId) {
      const error = new Error("Missing Orange ID (sub or id)");
      setError(error);
      onError?.(error);
      return;
    }

    // Get token from local storage
    const tokenData = localStorage.getItem("passport-token");
    if (!tokenData) {
      const error = new Error("Missing passport token in localStorage");
      setError(error);
      onError?.(error);
      return;
    }
    
    const token = JSON.parse(tokenData).state.accessToken;
    if (!token) {
      const error = new Error("Missing access token");
      setError(error);
      onError?.(error);
      return;
    }

    setIsStoring(true);
    setError(null);

    try {
      const userData = {
        orangeId,
        username: user.name || user.displayName || orangeId,
        role: user.role || "user",
        email: user.email || "",
        authToken: token,
      };

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`Failed to store user: ${response.statusText}`);
      }

      onSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      console.error("Failed to store user:", error);
    } finally {
      setIsStoring(false);
    }
  };

  return { isStoring, error, storeUserInDB };
}