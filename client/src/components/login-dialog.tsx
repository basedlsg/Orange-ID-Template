import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LoginPanel } from "@bedrock_org/passport";
import { X } from "lucide-react";
import { useLoginPanel } from "@/contexts/LoginPanelContext";

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
  const { settings } = useLoginPanel();
  
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

          <LoginPanel {...settings} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
