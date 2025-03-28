import React from 'react';
import { BedrockPassportProvider } from "@bedrock_org/passport";

type OrangeAuthProviderProps = {
  baseUrl: string;
  tenantId: string;
  walletConnectId: string;
  authCallbackPath?: string;
  children?: React.ReactNode;
};

export function OrangeAuthProvider({
  baseUrl,
  tenantId,
  walletConnectId,
  authCallbackPath = '/auth/callback',
  children,
}: OrangeAuthProviderProps) {
  // Get the origin but handle potential undefined window during SSR
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const authCallbackUrl = `${origin}${authCallbackPath}`;

  return (
    <BedrockPassportProvider
      baseUrl={baseUrl}
      authCallbackUrl={authCallbackUrl}
      tenantId={tenantId}
      walletConnectId={walletConnectId}
    >
      {children}
    </BedrockPassportProvider>
  );
}