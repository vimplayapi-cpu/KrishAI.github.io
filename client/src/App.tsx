import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/_core/hooks/useAuth";
import CustomCursor from "@/components/CustomCursor";
import LoginGate from "@/components/LoginGate";
import NotFound from "@/pages/NotFound";
import { Route, Router as WouterRouter, Switch } from "wouter";
import RoleGuard from "./components/RoleGuard";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AdminGate } from "./components/AdminGate";
import DemoHub from "./demo/DemoHub";
import { isLocalDemoActive } from "@/_core/hooks/useAuth";
import Advisor from "./pages/Advisor";
import Advisory from "./pages/Advisory";
import Dashboard from "./pages/Dashboard";
import Farms from "./pages/Farms";
import Markets from "./pages/Markets";
import Notifications from "./pages/Notifications";
import Products from "./pages/Products";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";
import Research from "./pages/Research";
import Scan from "./pages/Scan";

function Router() {
  // The standalone admin.html entry launches the real admin console through a query flag.
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("admin") === "1") {
    return <AdminGate />;
  }
  // Every route is protected behind the login gate. The demo workspace is fully local
  // so GitHub Pages does not call unfinished backend procedures.
  if (isLocalDemoActive()) return <DemoHub />;
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Switch>
      <Route path={"/"}>
        <RoleGuard allowed={["farmer", "student", "admin"]}>
          <Dashboard />
        </RoleGuard>
      </Route>
      <Route path={"/dashboard"}>
        <RoleGuard allowed={["farmer", "student", "admin"]}>
          <Dashboard />
        </RoleGuard>
      </Route>
      <Route path={"/farms"}>
        <RoleGuard allowed={["farmer", "admin"]}>
          <Farms />
        </RoleGuard>
      </Route>
      <Route path={"/scan"}>
        <RoleGuard allowed={["farmer", "admin"]}>
          <Scan />
        </RoleGuard>
      </Route>
      <Route path={"/advisor"}>
        <RoleGuard allowed={["farmer", "student", "admin"]}>
          <Advisor />
        </RoleGuard>
      </Route>
      <Route path={"/market"}>
        <RoleGuard allowed={["farmer", "admin"]}>
          <Markets />
        </RoleGuard>
      </Route>
      <Route path={"/products"}>
        <RoleGuard allowed={["farmer", "student", "admin"]}>
          <Products />
        </RoleGuard>
      </Route>
      <Route path={"/research"}>
        <RoleGuard allowed={["student", "admin"]}>
          <Research />
        </RoleGuard>
      </Route>
      <Route path={"/reports"}>
        <RoleGuard allowed={["student", "admin"]}>
          <Reports />
        </RoleGuard>
      </Route>
      <Route path={"/advisory"}>
        <RoleGuard allowed={["farmer", "student", "admin"]}>
          <Advisory />
        </RoleGuard>
      </Route>
      <Route path={"/notifications"}>
        <RoleGuard allowed={["farmer", "student", "admin"]}>
          <Notifications />
        </RoleGuard>
      </Route>
      <Route path={"/profile"}>
        <RoleGuard allowed={["farmer", "student", "admin"]}>
          <Profile />
        </RoleGuard>
      </Route>
      {/* Dedicated admin backoffice — separate surface, unmounted from the customer app */}
      <Route path={"/admin"}>
        <AdminGate />
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster position="top-right" />
          <CustomCursor />
          <LoginGate>
            <Router />
          </LoginGate>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
