import React, { useState } from "react";
import { LoginDialog } from "./LoginDialog";

type LoginButtonProps = {
  buttonText?: string;
  buttonClassName?: string;
  loginMessage?: string;
  // For storing the return path
  currentPath: string;
  // Dialog props to pass through
  dialogProps?: Omit<React.ComponentProps<typeof LoginDialog>, 'open' | 'onOpenChange'>;
};

export function LoginButton({
  buttonText = "Login",
  buttonClassName = "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600",
  loginMessage,
  currentPath,
  dialogProps
}: LoginButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenLogin = () => {
    // Store current path to return after login
    sessionStorage.setItem("returnPath", currentPath);
    setIsDialogOpen(true);
  };

  return (
    <>
      <button
        onClick={handleOpenLogin}
        className={buttonClassName}
      >
        {buttonText}
      </button>
      <LoginDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        message={loginMessage}
        {...dialogProps}
      />
    </>
  );
}