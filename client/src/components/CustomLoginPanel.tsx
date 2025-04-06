import { LoginPanel } from "@bedrock_org/passport";
import { useLoginPanel } from "@/contexts/LoginPanelContext";
import { useBedrockPassport } from "@bedrock_org/passport";
import { useEffect } from "react";

export function CustomLoginPanel() {
  const { settings } = useLoginPanel();
  const { signIn } = useBedrockPassport();

  // When requireWalletSignature is true, force wallet connection instead of regular login
  useEffect(() => {
    if (settings.requireWalletSignature && settings.showConnectWallet) {
      // This will be handled by the LoginPanel's UI
      console.log("[CustomLoginPanel] Wallet signature is required");
    }
  }, [settings.requireWalletSignature, settings.showConnectWallet, signIn]);

  // If requireWalletSignature is true, we make showConnectWallet also true
  // to ensure wallet connection is always displayed
  const panelSettings = {
    ...settings,
    showConnectWallet: settings.requireWalletSignature ? true : settings.showConnectWallet
  };

  return <LoginPanel {...panelSettings} />;
}