import { BedrockPassportProvider } from "@bedrock_org/passport";

export function OrangeAuthProvider({
  children,
}: {
  children?: React.ReactNode;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <BedrockPassportProvider
      baseUrl={import.meta.env.VITE_ORANGE_BASE_URL}
      authCallbackUrl={`${origin}/auth/callback`}
      tenantId="juice-town"
      walletConnectId={import.meta.env.VITE_WALLETCONNECT_PROJECT_ID}
      widgetConfig={{
        enabled: false,
        disableWidget: true,
      }}
      config={{
        disableWidget: true,
      }}
    >
      {children}
    </BedrockPassportProvider>
  );
}