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
            className="absolute right-2 top-2 z-50 rounded-full p-1.5 text-orange-500 opacity-70 hover:bg-orange-100 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 bg-white"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-t-lg border-b border-orange-300 text-center">
            <p className="text-sm sm:text-base font-medium text-white leading-relaxed">
              {message}
            </p>
          </div>
          <LoginPanel
            panelClass="bg-white text-gray-800 w-full backdrop-blur-lg border border-orange-200 rounded-b-lg shadow-lg"
            buttonClass="w-full bg-orange-500 hover:bg-orange-600 text-white transition-all duration-200"
            headerClass="justify-center pb-6"
            logo="/orange_logo.png"
            title=""
            titleClass="text-xl font-semibold text-orange-500"
            logoAlt="Orange Auth"
            logoClass="ml-2 h-8"
            showConnectWallet={false}
            walletButtonClass="w-full border border-orange-300 hover:bg-orange-50 transition-all duration-200 text-orange-500"
            walletButtonText="Connect Wallet"
            separatorTextClass="bg-white text-orange-500 px-2"
            separatorClass="bg-orange-200"
            separatorText="or"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
