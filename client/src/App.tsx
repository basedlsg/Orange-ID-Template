import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Submit from "@/pages/submit";
import Admin from "@/pages/admin";

function Navigation() {
  return (
    <nav className="border-b">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/">
          <span className="text-xl font-bold cursor-pointer">VibeCodingList</span>
        </Link>
        <div className="ml-auto space-x-4">
          <Link href="/submit">
            <span className="text-sm font-medium hover:text-primary cursor-pointer">Submit Project</span>
          </Link>
          <Link href="/admin">
            <span className="text-sm font-medium hover:text-primary cursor-pointer">Admin</span>
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