import { BedrockPassportProvider } from "@bedrock_org/passport";
import "@bedrock_org/passport/dist/style.css";

export function OrangeAuthProvider({
  children,
}: {
  children?: React.ReactNode;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <BedrockPassportProvider
      baseUrl="https://api.bedrockpassport.com"
      authCallbackUrl={`${origin}/auth/callback`}
      tenantId="orange-vibe" // IMPORTANT: Replace with your Project ID from vibecodinglist.com/orange-id-integration
    >
      {children}
    </BedrockPassportProvider>
  );
}
