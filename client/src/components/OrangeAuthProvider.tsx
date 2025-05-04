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
      tenantId="orange-dhl93pieq6" // Updated with the correct tenant ID
    >
      {children}
    </BedrockPassportProvider>
  );
}
