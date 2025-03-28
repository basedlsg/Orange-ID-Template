import React from "react";
import { LoginPanel } from "@bedrock_org/passport";

type LoginDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
  // Styling props
  containerClassName?: string;
  closeButtonClassName?: string;
  messageClassName?: string;
  // LoginPanel props
  panelClass?: string;
  buttonClass?: string;
  headerClass?: string;
  logo?: string;
  title?: string;
  // Close button component
  CloseButton?: React.ComponentType<{onClick: () => void}>;
};

export function LoginDialog({
  open,
  onOpenChange,
  message = "Please log in to continue",
  containerClassName,
  closeButtonClassName,
  messageClassName,
  panelClass,
  buttonClass,
  headerClass,
  logo,
  title,
  CloseButton,
}: LoginDialogProps) {
  // Default styling
  const defaultContainerClass = "relative mx-auto w-[280px] sm:w-[380px]";
  const defaultMessageClass = "p-4 text-sm sm:text-base font-medium";
  const defaultCloseButtonClass = "absolute right-2 top-2 z-50 rounded-full p-1.5";
  
  // Combined classes
  const containerClass = containerClassName || defaultContainerClass;
  const messageClass = messageClassName || defaultMessageClass;
  const closeButtonClass = closeButtonClassName || defaultCloseButtonClass;

  // Only render when open
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className={containerClass}>
        {CloseButton ? (
          <CloseButton onClick={() => onOpenChange(false)} />
        ) : (
          <button
            onClick={() => onOpenChange(false)}
            className={closeButtonClass}
          >
            ✕
            <span className="sr-only">Close</span>
          </button>
        )}
        
        {message && (
          <div className={messageClass}>
            {message}
          </div>
        )}
        
        <LoginPanel
          panelClass={panelClass}
          buttonClass={buttonClass}
          headerClass={headerClass}
          logo={logo}
          title={title || ""}
        />
      </div>
    </div>
  );
}