import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { AdminApp } from "../admin/AdminApp";

/**
 * Dedicated SaaS backoffice surface at /admin.
 * Only admins get the real admin dashboard. Everyone else gets an access-
 * denied screen (never silently redirected, so audit trails stay clean).
 */
export function AdminGate() {
  const { loading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      // Non-signed-in visitors must sign in first (login gate lives in App).
      setLocation("/");
    }
  }, [loading, user, setLocation]);

  if (loading) return null;
  if (!user) return null;
  if (user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-clay p-6">
        <div className="flex flex-col items-center gap-5 rounded-3xl bg-background p-10 text-center shadow-soft-lg max-w-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full surface-rose">
            <ShieldAlert className="h-7 w-7 text-rose-600" />
          </div>
          <h1 className="text-xl font-bold text-ink">Restricted area</h1>
          <p className="text-sm text-muted-foreground">
            This is the operator backoffice. It is only available to platform administrators. Your account role does not have access.
          </p>
          <Button
            variant="outline"
            className="border-accent text-accent font-semibold"
            onClick={() => setLocation("/")}
          >
            Go back to the app
          </Button>
        </div>
      </div>
    );
  }
  return <AdminApp />;
}

export function startAdminLogin() {
  startLogin();
}
