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
      baseUrl="https://orange-id.orange-dao.org"
      authCallbackUrl={`${origin}/auth/callback`}
      tenantId="orange-vibe"
      walletConnectId={import.meta.env.VITE_WALLETCONNECT_PROJECT_ID}
    >
      {children}
    </BedrockPassportProvider>
  );
}
