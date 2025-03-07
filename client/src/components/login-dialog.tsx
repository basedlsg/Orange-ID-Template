import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LoginPanel } from "@bedrock_org/passport";
import { X } from "lucide-react";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
}

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
            className="absolute right-2 top-2 z-50 rounded-full p-1.5 text-blue-400 opacity-70 hover:bg-blue-900/30 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 bg-black/95"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          <div className="bg-gradient-to-br from-blue-900/90 to-black/95 p-4 rounded-t-lg border-b border-blue-500/20 text-center">
            <p className="text-sm sm:text-base font-medium text-blue-200 leading-relaxed">
              {message}
            </p>
          </div>
          <LoginPanel
            panelClass="bg-black/95 text-white w-full backdrop-blur-lg border border-blue-500/20 rounded-b-lg shadow-lg"
            buttonClass="w-full bg-black hover:bg-black/80 border border-blue-500/50 text-blue-400 hover:text-blue-300 transition-all duration-200"
            headerClass="justify-center pb-6"
            logo="https://irp.cdn-website.com/e81c109a/dms3rep/multi/orange-web3-logo-v2a-20241018.svg"
            title=""
            titleClass="text-xl font-semibold text-blue-400"
            logoAlt="Based Town"
            logoClass="ml-2 h-8"
            showConnectWallet={true}
            walletButtonClass="w-full border border-blue-500/50 hover:bg-blue-900/30 transition-all duration-200"
            walletButtonText="Connect Wallet"
            separatorTextClass="bg-black/95 text-blue-400 px-2"
            separatorClass="bg-blue-500/20"
            separatorText="or"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
