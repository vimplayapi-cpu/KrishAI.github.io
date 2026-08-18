import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

type Role = "farmer" | "student" | "researcher" | "professional" | "business" | "admin" | "user";

/**
 * RoleGuard: hides the page entirely when the signed-in role is not allowed.
 * Unauthorized access attempts are silently redirected to the dashboard (the
 * nav already hides these links per role, this covers typed URLs).
 */
export default function RoleGuard({ allowed, children }: { allowed: Role[]; children: React.ReactNode }) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const role = (user?.role ?? "user") as Role;

  if (allowed.includes(role)) return <>{children}</>;

  // Redirect unauthorized roles to the dashboard instead of a hard 404.
  // useEffect (not render-time) keeps this a valid React pattern.
  useEffect(() => {
    navigate("/", { replace: true });
  }, [navigate]);
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
