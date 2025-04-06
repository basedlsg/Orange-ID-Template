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
            className="absolute right-2 top-2 z-50 rounded-full p-1.5 text-[#F37920] opacity-70 hover:bg-gray-800 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#F37920] focus:ring-offset-2 bg-gray-900"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>

          <LoginPanel
            panelClass="bg-black text-white w-full backdrop-blur-lg border border-gray-700 rounded-lg shadow-lg container py-6 px-4 md:px-8"
            buttonClass="w-full bg-[#F37920] hover:bg-[#D86A10] text-white transition-all duration-200 hover:border-[#F37920] font-medium py-2.5 rounded-md"
            headerClass="justify-center pb-6"
            logo="/images/orangelogo.svg"
            title="Sign in to"
            titleClass="text-xl font-semibold text-[#F37920]"
            logoAlt="Orange Auth"
            logoClass="ml-2 h-8"
            showConnectWallet={true}
            walletButtonText="Connect Wallet"
            walletButtonClass="w-full border border-gray-700 hover:bg-gray-800 transition-all duration-200 text-[#F37920] font-medium py-2.5 rounded-md"
            separatorText="OR"
            separatorTextClass="bg-black text-[#F37920] px-2"
            separatorClass="bg-gray-700"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
