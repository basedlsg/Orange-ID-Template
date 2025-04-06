import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Color theme interface to manage colors separately
export interface ColorTheme {
  primary: string;
  buttonBg: string;
  buttonHoverBg: string;
  panelBg: string;
  textColor: string;
  borderColor: string;
}

export interface LoginPanelSettings {
  panelClass: string;
  buttonClass: string;
  headerClass: string;
  logo: string;
  title: string;
  titleClass: string;
  logoAlt: string;
  logoClass: string;
  showConnectWallet: boolean;
  walletButtonText: string;
  walletButtonClass: string;
  separatorText: string;
  separatorTextClass: string;
  separatorClass: string;
  requireWalletSignature?: boolean;
}

// Default color theme
export const defaultTheme: ColorTheme = {
  primary: "#F37920",
  buttonBg: "#F37920",
  buttonHoverBg: "#D86A10",
  panelBg: "#000000",
  textColor: "#FFFFFF",
  borderColor: "#374151"
};

export const defaultSettings: LoginPanelSettings = {
  panelClass: "bg-black text-white w-full backdrop-blur-lg border border-gray-700 rounded-lg shadow-lg container py-6 px-4 md:px-8",
  buttonClass: "w-full bg-[#F37920] hover:bg-[#D86A10] text-white transition-all duration-200 hover:border-[#F37920] font-medium py-2.5 rounded-md",
  headerClass: "justify-center pb-6",
  logo: "/images/orangelogo.svg",
  title: "Sign in to",
  titleClass: "text-xl font-semibold text-[#F37920]",
  logoAlt: "Orange Auth",
  logoClass: "ml-2 h-8",
  showConnectWallet: true,
  walletButtonText: "Connect Wallet",
  walletButtonClass: "w-full border border-gray-700 hover:bg-gray-800 transition-all duration-200 text-[#F37920] font-medium py-2.5 rounded-md",
  separatorText: "OR",
  separatorTextClass: "bg-black text-[#F37920] px-2",
  separatorClass: "bg-gray-700",
  requireWalletSignature: true
};

type LoginPanelContextType = {
  settings: LoginPanelSettings;
  theme: ColorTheme;
  updateSettings: (newSettings: Partial<LoginPanelSettings>) => void;
  updateTheme: (newTheme: Partial<ColorTheme>) => void;
  resetToDefaults: () => void;
};

// Create the context with a default value
const LoginPanelContext = createContext<LoginPanelContextType | undefined>(undefined);

// Provider component that wraps app and makes context available
export function LoginPanelProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<LoginPanelSettings>(defaultSettings);
  const [theme, setTheme] = useState<ColorTheme>(defaultTheme);

  // Apply theme changes to settings whenever theme changes
  useEffect(() => {
    // Update CSS classes using the current theme colors
    const updatedSettings = {
      ...settings,
      panelClass: `bg-[${theme.panelBg}] text-[${theme.textColor}] w-full backdrop-blur-lg border border-[${theme.borderColor}] rounded-lg shadow-lg container py-6 px-4 md:px-8`,
      buttonClass: `w-full bg-[${theme.buttonBg}] hover:bg-[${theme.buttonHoverBg}] text-white transition-all duration-200 hover:border-[${theme.primary}] font-medium py-2.5 rounded-md`,
      titleClass: `text-xl font-semibold text-[${theme.primary}]`,
      walletButtonClass: `w-full border border-[${theme.borderColor}] hover:bg-gray-800 transition-all duration-200 text-[${theme.primary}] font-medium py-2.5 rounded-md`,
      separatorTextClass: `bg-[${theme.panelBg}] text-[${theme.primary}] px-2`,
      separatorClass: `bg-[${theme.borderColor}]`,
      requireWalletSignature: true
    };
    
    setSettings(updatedSettings);
  }, [theme]);

  const updateSettings = (newSettings: Partial<LoginPanelSettings>) => {
    setSettings({ ...settings, ...newSettings });
  };

  const updateTheme = (newTheme: Partial<ColorTheme>) => {
    setTheme({ ...theme, ...newTheme });
  };

  const resetToDefaults = () => {
    setTheme(defaultTheme);
    setSettings(defaultSettings);
  };

  // The context value that will be provided
  const contextValue: LoginPanelContextType = {
    settings,
    theme,
    updateSettings,
    updateTheme,
    resetToDefaults
  };

  return (
    <LoginPanelContext.Provider value={contextValue}>
      {children}
    </LoginPanelContext.Provider>
  );
}

// Custom hook to use the LoginPanel context
export function useLoginPanel() {
  const context = useContext(LoginPanelContext);
  if (context === undefined) {
    throw new Error("useLoginPanel must be used within a LoginPanelProvider");
  }
  return context;
}