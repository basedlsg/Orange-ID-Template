import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useCallback, useEffect } from "react";
import { BedrockPassportProvider } from "@bedrock_org/passport";

export function OrangeAuthProvider({
  children,
}: {
  children?: React.ReactNode;
}) {
  // Get the origin but handle potential undefined window during SSR
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <BedrockPassportProvider
      baseUrl={import.meta.env.VITE_ORANGE_BASE_URL}
      authCallbackUrl={`${origin}/auth/callback`}
      tenantId="juice-town"
      walletConnectId={import.meta.env.VITE_WALLETCONNECT_PROJECT_ID}
      disableWidget={true} // Add this line to disable the widget
    >
      {children}
    </BedrockPassportProvider>
  );
}