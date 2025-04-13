import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LoginPanel } from "@bedrock_org/passport";
import { X } from "lucide-react";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
}

// Default settings for the login panel
const defaultSettings = {
  panelClass: "container p-2 md:p-8 rounded-2xl max-w-[480px]",
  buttonClass: "hover:border-orange-500",
  headerClass: "justify-center",
  logo: "https://irp.cdn-website.com/e81c109a/dms3rep/multi/orange-web3-logo-v2a-20241018.svg",
  title: "Sign in to",
  titleClass: "text-xl font-bold",
  logoAlt: "Orange Web3",
  logoClass: "ml-2 h-8",
  showConnectWallet: false,
  walletButtonText: "Connect Wallet",
  separatorText: "OR",
  separatorTextClass: "bg-orange-900",
  separatorClass: "bg-orange-900",
  linkRowClass: "justify-center",
  features: {
    enableWalletConnect: false,
    enableAppleLogin: true,
    enableGoogleLogin: true,
    enableEmailLogin: true,
  },
};

export function LoginDialog({
  open,
  onOpenChange,
  message = "Please log in to continue",
}: LoginDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-none bg-transparent shadow-2xl mx-auto max-w-[90vw] sm:max-w-none">
        <div className="flex flex-col relative mx-auto w-[280px] sm:w-[380px]">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-2 top-2 z-50 rounded-full p-1.5 text-[#F37920] opacity-70 hover:bg-gray-800 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#F37920] focus:ring-offset-2 bg-gray-900"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>

          <LoginPanel {...defaultSettings} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
