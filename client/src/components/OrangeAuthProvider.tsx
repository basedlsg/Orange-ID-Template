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
      baseUrl="https://api.bedrockpassport.com"
      authCallbackUrl={`${origin}/auth/callback`}
      tenantId="orange-vibe"
      walletConnectId="591d21ef88b24c6837599a5c2a0ce03d"
    >
      {children}
    </BedrockPassportProvider>
  );
}
