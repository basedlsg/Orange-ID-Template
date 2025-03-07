import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Submit from "@/pages/submit";
import Admin from "@/pages/admin";

async function storeUserInDB(user: any) {
  // Log the complete user object to understand its structure
  console.log("Complete BedrockPassport user object:", user);

  // Validate required fields with more detailed error messages
  if (!user) {
    throw new Error("No user data provided");
  }

  // Check for Orange ID in either sub or id field
  const orangeId = user.sub || user.id;
  if (!orangeId) {
    throw new Error("Missing Orange ID (sub or id)");
  }

  // // Check other required fields
  // if (!user.name && !user.displayName) {
  //   throw new Error("Missing user name");
  // }
  // if (!user.email) {
  //   throw new Error("Missing user email");
  // }

  const token = JSON.parse(localStorage.getItem("passport-token")!).state
    .accessToken;
  if (!token) throw new Error("Missing access token");

  try {
    const userData = {
      customId: orangeId,
      name: user.name || user.displayName || "",
      role: user.role || "user",
      email: user.email || "",
      authToken: token,
    };

    console.log("Sending user data to API:", userData);

    const response = await fetch("/api/orangeidusers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to store user data");
    }

    const data = await response.json();
    console.log("User stored successfully:", data);
    return data;
  } catch (error) {
    console.error("Error storing user:", error);
    throw error;
  }
}

function StoreUserData() {
  const { isLoggedIn, user } = useBedrockPassport();
  const { toast } = useToast();

  useEffect(() => {
    if (isLoggedIn && user) {
      console.log("BedrockPassport user data:", user);
      storeUserInDB(user).catch((err) => {
        console.error("Failed to store user:", err);
        toast({
          variant: "destructive",
          title: "Error storing user data",
          description:
            err instanceof Error ? err.message : "Please try again later",
        });
      });
    }
  }, [isLoggedIn, user, toast]);

  return null;
}

function ProtectedRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const [location] = useLocation();
  const { isLoggedIn, isLoading, signOut, user } = useBedrockPassport();
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isDialogOpen) {
      setLocation("/");
    }
  }, [isDialogOpen, setLocation]);

  const handleLogout = async () => {
    try {
      await signOut?.();
      toast({
        title: "Logged out successfully",
        description: "Come back soon!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error logging out",
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsDialogOpen(true);
    }
  };

  if (!isLoggedIn && !isLoading) {
    sessionStorage.setItem("returnPath", location);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="p-0 border-none bg-transparent shadow-2xl mx-auto max-w-[90vw] sm:max-w-none">
          <div className="flex flex-col relative mx-auto w-[280px] sm:w-[380px]">
            <button
              onClick={() => setIsDialogOpen(false)}
              className="absolute right-2 top-2 z-50 rounded-full p-1.5 text-orange-400 opacity-70 hover:bg-orange-900/30 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 bg-black/95"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
            <div className="bg-gradient-to-br from-orange-900/90 to-black/95 p-4 rounded-t-lg border-b border-orange-500/20 text-center">
              <p className="text-sm sm:text-base font-medium text-orange-200 leading-relaxed">
                To qualify for{" "}
                <span className="text-orange-400 font-semibold">$TOWN</span>{" "}
                airdrops, please connect one of your socials and verify your
                wallet holding your{" "}
                <span className="text-orange-400 font-semibold">$TOWN</span>{" "}
                tokens.
              </p>
            </div>
            <LoginPanel
              panelClass="bg-black/95 text-white w-full backdrop-blur-lg border border-orange-500/20 rounded-b-lg shadow-lg"
              buttonClass="w-full bg-black hover:bg-black/80 border border-orange-500/50 text-orange-400 hover:text-orange-300 transition-all duration-200"
              headerClass="justify-center pb-6"
              logo="https://irp.cdn-website.com/e81c109a/dms3rep/multi/orange-web3-logo-v2a-20241018.svg"
              title=""
              titleClass="text-xl font-semibold text-orange-400"
              logoAlt="Based Town"
              logoClass="ml-2 h-8"
              showConnectWallet={true}
              walletButtonClass="w-full border border-orange-500/50 hover:bg-orange-900/30 transition-all duration-200"
              walletButtonText="Connect Wallet"
              separatorTextClass="bg-black/95 text-orange-400 px-2"
              separatorClass="bg-orange-500/20"
              separatorText="or"
            />
            {isLoggedIn && (
              <div className="bg-black/95 p-4 mt-4 rounded-lg border border-orange-500/20">
                <Button
                  variant="ghost"
                  className="w-full text-orange-400 hover:text-orange-300 hover:bg-orange-900/30"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return <Component />;
}

function Navigation() {
  return (
    <nav className="border-b">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/">
          <span className="text-xl font-bold cursor-pointer">
            VibeCodingList
          </span>
        </Link>
        <div className="ml-auto space-x-4">
          <Link href="/submit">
            <span className="text-sm font-medium hover:text-primary cursor-pointer">
              Submit Project
            </span>
          </Link>
          <Link href="/admin">
            <span className="text-sm font-medium hover:text-primary cursor-pointer">
              Admin
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/submit" component={Submit} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Navigation />
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
