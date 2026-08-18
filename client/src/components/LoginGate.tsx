import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { BookOpen, Loader2, Lock, Sprout, Tractor, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const LOGO = "/manus-storage/krishai-logo-3d_27b8131e.png";

/**
 * LoginGate: KrishAI Hub is fully protected — no route is accessible without
 * signing in. Visitors must log in with the demo credentials to enter.
 */
export default function LoginGate({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-clay">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}

function LoginScreen() {
  const utils = trpc.useUtils();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"farmer" | "student">("farmer");
  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success(`Welcome to KrishAI Hub as ${role === "farmer" ? "Farmer" : "Student"}!`);
    },
    onError: (err) => {
      toast.error(err.message || "Invalid username or password");
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login.isPending) return;
    if (!username.trim() || !password) {
      toast.error("Please enter both username and password");
      return;
    }
    login.mutate({ username: username.trim(), password, role });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-clay px-4">
      {/* soft clay glows */}
      <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-sage/25 blur-3xl" />
      <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-lavender/30 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-peach/20 blur-3xl" />

      <form
        onSubmit={submit}
        className="neu-raised relative z-10 flex w-full max-w-md flex-col items-center gap-6 rounded-[2rem] p-8"
      >
        <img
          src={LOGO}
          alt="KrishAI Hub logo"
          className="h-24 w-24 rounded-full object-cover shadow-soft-md"
        />
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold tracking-wide text-ink">KrishAI Hub</h1>
          <p className="font-ui mt-2 text-lg text-muted-foreground">AI-Powered Agriculture Intelligence</p>
        </div>

        <p className="max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
          Weather intelligence, crop lifecycle tracking, AI vision disease scanning, live mandi prices
          and a 24/7 AI agriculture advisor — built for farmers, students, researchers and administrators.
          This platform is fully protected; choose your role and sign in to continue.
        </p>

        {/* Role selector — determines which features are available */}
        <div className="flex w-full gap-3">
          {(
            [
              { key: "farmer", label: "Farmer", sub: "Farms · Scan · Markets", icon: Tractor },
              { key: "student", label: "Student", sub: "Research · Data · Reports", icon: BookOpen },
            ] as const
          ).map(({ key, label, sub, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setRole(key)}
              className={
                "flex flex-1 flex-col items-center gap-1.5 rounded-2.5xl px-3 py-3.5 transition-all duration-200 active:scale-[0.97] " +
                (role === key
                  ? "surface-sage-deep shadow-soft-sm ring-2 ring-primary/60"
                  : "neu-raised opacity-80 hover:opacity-100")
              }
            >
              <Icon className={"h-5 w-5 " + (role === key ? "text-primary" : "text-muted-foreground")} />
              <span className={"font-display text-sm font-bold " + (role === key ? "text-primary" : "text-foreground")}>{label}</span>
              <span className={"text-[10px] leading-tight " + (role === key ? "text-primary/80" : "text-muted-foreground")}>{sub}</span>
            </button>
          ))}
        </div>

        <div className="neu-pressed flex w-full items-center gap-3 rounded-full px-4 py-3">
          <Lock className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-xs text-muted-foreground">Demo access: username <b>demo</b> · password <b>123456</b></span>
        </div>

        <div className="flex w-full flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="neu-input rounded-2xl px-4 py-3 text-ink outline-none transition-all focus:shadow-glow focus-visible"
              placeholder="demo"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="neu-input rounded-2xl px-4 py-3 text-ink outline-none transition-all focus:shadow-glow"
              placeholder="123456"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={login.isPending}
          className="neu-button btn-vivid-orange w-full rounded-full px-6 py-3.5 font-display text-base font-semibold tracking-wider shadow-soft-sm transition-all duration-200 active:scale-[0.97] active:shadow-inset-sm disabled:opacity-60"
        >
          {login.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Entering…
            </span>
          ) : (
            <>Enter as {role === "farmer" ? "Farmer" : "Student"}</>
          )}
        </button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sprout className="h-3.5 w-3.5 text-accent" />
          <span>Free for everyone · Real data · Futuristic by design</span>
        </div>
      </form>
    </div>
  );
}

/** Convenience: log out from anywhere */
export function LogoutButton({ className }: { className?: string }) {
  const utils = trpc.useUtils();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
    },
  });
  return (
    <button
      className={`rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground shadow-soft-xs transition-all duration-150 hover:text-ink active:shadow-inset-sm ${className ?? ""}`}
      onClick={() => logout.mutate()}
    >
      Log out
    </button>
  );
}
