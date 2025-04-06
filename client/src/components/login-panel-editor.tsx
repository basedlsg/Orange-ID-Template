import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginPanel } from "@bedrock_org/passport";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";

// Color theme interface to manage colors separately
interface ColorTheme {
  primary: string;
  buttonBg: string;
  buttonHoverBg: string;
  panelBg: string;
  textColor: string;
  borderColor: string;
}

interface LoginPanelSettings {
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
}

// Default color theme
const defaultTheme: ColorTheme = {
  primary: "#F37920",
  buttonBg: "#F37920",
  buttonHoverBg: "#D86A10",
  panelBg: "#000000",
  textColor: "#FFFFFF",
  borderColor: "#374151"
};

const defaultSettings: LoginPanelSettings = {
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
  separatorClass: "bg-gray-700"
};

export function LoginPanelEditor() {
  const [settings, setSettings] = useState<LoginPanelSettings>(defaultSettings);
  const [theme, setTheme] = useState<ColorTheme>(defaultTheme);
  const [activeTab, setActiveTab] = useState("appearance");
  const { toast } = useToast();

  // Apply theme changes to settings whenever theme changes
  useEffect(() => {
    // Update CSS classes using the current theme colors
    const updatedSettings = {
      ...settings,
      panelClass: `bg-[${theme.panelBg}] text-[${theme.textColor}] w-full backdrop-blur-lg border border-[${theme.borderColor}] rounded-lg shadow-lg container py-6 px-4 md:px-8`,
      buttonClass: `w-full bg-[${theme.buttonBg}] hover:bg-[${theme.buttonHoverBg}] text-[${theme.textColor}] transition-all duration-200 hover:border-[${theme.primary}] font-medium py-2.5 rounded-md`,
      titleClass: `text-xl font-semibold text-[${theme.primary}]`,
      walletButtonClass: `w-full border border-[${theme.borderColor}] hover:bg-gray-800 transition-all duration-200 text-[${theme.primary}] font-medium py-2.5 rounded-md`,
      separatorTextClass: `bg-[${theme.panelBg}] text-[${theme.primary}] px-2`,
      separatorClass: `bg-[${theme.borderColor}]`
    };
    
    setSettings(updatedSettings);
  }, [theme]);

  const handleSettingChange = (key: keyof LoginPanelSettings, value: string | boolean) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleThemeChange = (key: keyof ColorTheme, value: string) => {
    setTheme({ ...theme, [key]: value });
  };

  const resetToDefaults = () => {
    setTheme(defaultTheme);
    setSettings(defaultSettings);
  };

  const copySettings = () => {
    const settingsString = Object.entries(settings)
      .map(([key, value]) => {
        if (typeof value === 'boolean') {
          return `${key}={${value}}`;
        } else if (value === undefined) {
          return '';
        } else {
          return `${key}="${value}"`;
        }
      })
      .filter(Boolean)
      .join("\n            ");
    
    const codeSnippet = `<LoginPanel
            ${settingsString}
          />`;
          
    navigator.clipboard.writeText(codeSnippet)
      .then(() => {
        toast({
          title: "Settings copied",
          description: "The login panel settings have been copied to clipboard.",
        });
      })
      .catch(err => {
        console.error("Failed to copy: ", err);
        toast({
          title: "Error",
          description: "Failed to copy settings. Check console for details.",
          variant: "destructive"
        });
      });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-4">
      <div className="w-full lg:w-1/2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-[#F37920]">Login Panel Editor</CardTitle>
            <CardDescription>
              Customize the appearance of the Bedrock Passport login component
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full mb-4">
                <TabsTrigger value="colors" className="flex-1">Colors</TabsTrigger>
                <TabsTrigger value="appearance" className="flex-1">Advanced CSS</TabsTrigger>
                <TabsTrigger value="content" className="flex-1">Content</TabsTrigger>
                <TabsTrigger value="wallet" className="flex-1">Wallet</TabsTrigger>
              </TabsList>
              
              <TabsContent value="colors" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Primary Colors</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor" className="flex justify-between">
                        Primary Color
                        <span className="text-xs text-gray-400">{theme.primary}</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          id="primaryColor" 
                          value={theme.primary}
                          onChange={(e) => handleThemeChange('primary', e.target.value)}
                          className="h-10 w-10 rounded cursor-pointer"
                        />
                        <Input 
                          value={theme.primary}
                          onChange={(e) => handleThemeChange('primary', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="textColor" className="flex justify-between">
                        Text Color
                        <span className="text-xs text-gray-400">{theme.textColor}</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          id="textColor" 
                          value={theme.textColor}
                          onChange={(e) => handleThemeChange('textColor', e.target.value)}
                          className="h-10 w-10 rounded cursor-pointer"
                        />
                        <Input 
                          value={theme.textColor}
                          onChange={(e) => handleThemeChange('textColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Panel Colors</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="panelBg" className="flex justify-between">
                        Panel Background
                        <span className="text-xs text-gray-400">{theme.panelBg}</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          id="panelBg" 
                          value={theme.panelBg}
                          onChange={(e) => handleThemeChange('panelBg', e.target.value)}
                          className="h-10 w-10 rounded cursor-pointer"
                        />
                        <Input 
                          value={theme.panelBg}
                          onChange={(e) => handleThemeChange('panelBg', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="borderColor" className="flex justify-between">
                        Border Color
                        <span className="text-xs text-gray-400">{theme.borderColor}</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          id="borderColor" 
                          value={theme.borderColor}
                          onChange={(e) => handleThemeChange('borderColor', e.target.value)}
                          className="h-10 w-10 rounded cursor-pointer"
                        />
                        <Input 
                          value={theme.borderColor}
                          onChange={(e) => handleThemeChange('borderColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Button Colors</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="buttonBg" className="flex justify-between">
                        Button Background
                        <span className="text-xs text-gray-400">{theme.buttonBg}</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          id="buttonBg" 
                          value={theme.buttonBg}
                          onChange={(e) => handleThemeChange('buttonBg', e.target.value)}
                          className="h-10 w-10 rounded cursor-pointer"
                        />
                        <Input 
                          value={theme.buttonBg}
                          onChange={(e) => handleThemeChange('buttonBg', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="buttonHoverBg" className="flex justify-between">
                        Button Hover
                        <span className="text-xs text-gray-400">{theme.buttonHoverBg}</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          id="buttonHoverBg" 
                          value={theme.buttonHoverBg}
                          onChange={(e) => handleThemeChange('buttonHoverBg', e.target.value)}
                          className="h-10 w-10 rounded cursor-pointer"
                        />
                        <Input 
                          value={theme.buttonHoverBg}
                          onChange={(e) => handleThemeChange('buttonHoverBg', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>


              </TabsContent>
              
              <TabsContent value="appearance" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="panelClass">Panel Class</Label>
                  <Input 
                    id="panelClass" 
                    value={settings.panelClass} 
                    onChange={(e) => handleSettingChange('panelClass', e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="buttonClass">Button Class</Label>
                  <Input 
                    id="buttonClass" 
                    value={settings.buttonClass} 
                    onChange={(e) => handleSettingChange('buttonClass', e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="headerClass">Header Class</Label>
                  <Input 
                    id="headerClass" 
                    value={settings.headerClass} 
                    onChange={(e) => handleSettingChange('headerClass', e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="titleClass">Title Class</Label>
                  <Input 
                    id="titleClass" 
                    value={settings.titleClass} 
                    onChange={(e) => handleSettingChange('titleClass', e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logoClass">Logo Class</Label>
                  <Input 
                    id="logoClass" 
                    value={settings.logoClass} 
                    onChange={(e) => handleSettingChange('logoClass', e.target.value)} 
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    value={settings.title} 
                    onChange={(e) => handleSettingChange('title', e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input 
                    id="logo" 
                    value={settings.logo} 
                    onChange={(e) => handleSettingChange('logo', e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logoAlt">Logo Alt Text</Label>
                  <Input 
                    id="logoAlt" 
                    value={settings.logoAlt} 
                    onChange={(e) => handleSettingChange('logoAlt', e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="separatorText">Separator Text</Label>
                  <Input 
                    id="separatorText" 
                    value={settings.separatorText} 
                    onChange={(e) => handleSettingChange('separatorText', e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="separatorTextClass">Separator Text Class</Label>
                  <Input 
                    id="separatorTextClass" 
                    value={settings.separatorTextClass} 
                    onChange={(e) => handleSettingChange('separatorTextClass', e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="separatorClass">Separator Class</Label>
                  <Input 
                    id="separatorClass" 
                    value={settings.separatorClass} 
                    onChange={(e) => handleSettingChange('separatorClass', e.target.value)} 
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="wallet" className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="showConnectWallet" 
                    checked={settings.showConnectWallet} 
                    onCheckedChange={(checked) => handleSettingChange('showConnectWallet', checked === true)} 
                  />
                  <Label htmlFor="showConnectWallet">Show Connect Wallet</Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="walletButtonText">Wallet Button Text</Label>
                  <Input 
                    id="walletButtonText" 
                    value={settings.walletButtonText} 
                    onChange={(e) => handleSettingChange('walletButtonText', e.target.value)} 
                    disabled={!settings.showConnectWallet}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="walletButtonClass">Wallet Button Class</Label>
                  <Input 
                    id="walletButtonClass" 
                    value={settings.walletButtonClass} 
                    onChange={(e) => handleSettingChange('walletButtonClass', e.target.value)} 
                    disabled={!settings.showConnectWallet}
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={resetToDefaults}>
                Reset to Defaults
              </Button>
              <Button variant="default" className="bg-[#F37920] hover:bg-[#D86A10]" onClick={copySettings}>
                Copy Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="w-full lg:w-1/2">
        <Card>
          <CardHeader>
            <CardTitle className="text-[#F37920]">Preview</CardTitle>
            <CardDescription>
              Live preview of the customized login panel
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-0">
            <div className="w-full max-w-md bg-gray-900 rounded-lg">
              <div className="bg-gradient-to-br from-[#F37920] to-[#D86A10] p-4 rounded-t-lg border-b border-gray-700 text-center">
                <p className="text-sm sm:text-base font-medium text-white leading-relaxed">
                  Preview of your customized login panel
                </p>
              </div>
              <LoginPanel {...settings} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-[#F37920]">Generated Code</CardTitle>
            <CardDescription>
              Copy and paste this code to use your customized login panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-gray-900 rounded-lg overflow-x-auto text-xs sm:text-sm">
              <code>
{`<LoginPanel
  panelClass="${settings.panelClass}"
  buttonClass="${settings.buttonClass}"
  headerClass="${settings.headerClass}"
  logo="${settings.logo}"
  title="${settings.title}"
  titleClass="${settings.titleClass}"
  logoAlt="${settings.logoAlt}"
  logoClass="${settings.logoClass}"
  showConnectWallet={${settings.showConnectWallet}}
  walletButtonText="${settings.walletButtonText}"
  walletButtonClass="${settings.walletButtonClass}"
  separatorText="${settings.separatorText}"
  separatorTextClass="${settings.separatorTextClass}"
  separatorClass="${settings.separatorClass}"
/>`}
              </code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}