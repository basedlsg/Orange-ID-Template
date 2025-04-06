import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginPanel } from "@bedrock_org/passport";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

const defaultSettings: LoginPanelSettings = {
  panelClass: "bg-black text-white w-full backdrop-blur-lg border border-gray-700 rounded-lg shadow-lg container p-2 md:p-8",
  buttonClass: "w-full bg-[#F37920] hover:bg-[#D86A10] text-white transition-all duration-200 hover:border-[#F37920]",
  headerClass: "justify-center pb-6",
  logo: "/images/orangelogo.svg",
  title: "Sign in to",
  titleClass: "text-xl font-semibold text-[#F37920]",
  logoAlt: "Orange Auth",
  logoClass: "ml-2 h-8",
  showConnectWallet: true,
  walletButtonText: "Connect Wallet",
  walletButtonClass: "w-full border border-gray-700 hover:bg-gray-800 transition-all duration-200 text-[#F37920]",
  separatorText: "OR",
  separatorTextClass: "bg-black text-[#F37920] px-2",
  separatorClass: "bg-gray-700"
};

export function LoginPanelEditor() {
  const [settings, setSettings] = useState<LoginPanelSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState("appearance");

  const handleChange = (key: keyof LoginPanelSettings, value: string | boolean) => {
    setSettings({ ...settings, [key]: value });
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
  };

  const copySettings = () => {
    const settingsString = Object.entries(settings)
      .map(([key, value]) => {
        if (typeof value === 'boolean') {
          return `${key}={${value}}`;
        } else {
          return `${key}="${value}"`;
        }
      })
      .join("\n            ");
    
    const codeSnippet = `<LoginPanel
            ${settingsString}
          />`;
          
    navigator.clipboard.writeText(codeSnippet)
      .then(() => {
        alert("Settings copied to clipboard!");
      })
      .catch(err => {
        console.error("Failed to copy: ", err);
        alert("Failed to copy settings. See console for details.");
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
                <TabsTrigger value="appearance" className="flex-1">Appearance</TabsTrigger>
                <TabsTrigger value="content" className="flex-1">Content</TabsTrigger>
                <TabsTrigger value="wallet" className="flex-1">Wallet</TabsTrigger>
              </TabsList>
              
              <TabsContent value="appearance" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="panelClass">Panel Class</Label>
                  <Input 
                    id="panelClass" 
                    value={settings.panelClass} 
                    onChange={(e) => handleChange('panelClass', e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="buttonClass">Button Class</Label>
                  <Input 
                    id="buttonClass" 
                    value={settings.buttonClass} 
                    onChange={(e) => handleChange('buttonClass', e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="headerClass">Header Class</Label>
                  <Input 
                    id="headerClass" 
                    value={settings.headerClass} 
                    onChange={(e) => handleChange('headerClass', e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="titleClass">Title Class</Label>
                  <Input 
                    id="titleClass" 
                    value={settings.titleClass} 
                    onChange={(e) => handleChange('titleClass', e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logoClass">Logo Class</Label>
                  <Input 
                    id="logoClass" 
                    value={settings.logoClass} 
                    onChange={(e) => handleChange('logoClass', e.target.value)} 
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    value={settings.title} 
                    onChange={(e) => handleChange('title', e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input 
                    id="logo" 
                    value={settings.logo} 
                    onChange={(e) => handleChange('logo', e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logoAlt">Logo Alt Text</Label>
                  <Input 
                    id="logoAlt" 
                    value={settings.logoAlt} 
                    onChange={(e) => handleChange('logoAlt', e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="separatorText">Separator Text</Label>
                  <Input 
                    id="separatorText" 
                    value={settings.separatorText} 
                    onChange={(e) => handleChange('separatorText', e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="separatorTextClass">Separator Text Class</Label>
                  <Input 
                    id="separatorTextClass" 
                    value={settings.separatorTextClass} 
                    onChange={(e) => handleChange('separatorTextClass', e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="separatorClass">Separator Class</Label>
                  <Input 
                    id="separatorClass" 
                    value={settings.separatorClass} 
                    onChange={(e) => handleChange('separatorClass', e.target.value)} 
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="wallet" className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="showConnectWallet" 
                    checked={settings.showConnectWallet} 
                    onCheckedChange={(checked) => handleChange('showConnectWallet', checked === true)} 
                  />
                  <Label htmlFor="showConnectWallet">Show Connect Wallet</Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="walletButtonText">Wallet Button Text</Label>
                  <Input 
                    id="walletButtonText" 
                    value={settings.walletButtonText} 
                    onChange={(e) => handleChange('walletButtonText', e.target.value)} 
                    disabled={!settings.showConnectWallet}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="walletButtonClass">Wallet Button Class</Label>
                  <Input 
                    id="walletButtonClass" 
                    value={settings.walletButtonClass} 
                    onChange={(e) => handleChange('walletButtonClass', e.target.value)} 
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