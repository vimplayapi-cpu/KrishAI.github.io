import { activateLocalDemoSession, clearLocalDemoSession, isLocalDemoActive, useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { BookOpen, Loader2, Lock, Sprout, Tractor } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const LOGO = `${import.meta.env.BASE_URL}krishai-logo.svg`;
type Role = "farmer" | "student";

export default function LoginGate({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-clay">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return <AuthScreen />;
  return <>{children}</>;
}

function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<Role>("farmer");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const utils = trpc.useUtils();

  const login = trpc.auth.login.useMutation({
    onSuccess: async (result) => {
      await utils.auth.me.invalidate();
      toast.success(result.role === "admin" ? "Welcome to the admin account." : "Welcome back to KrishAI Hub.");
    },
    onError: (error) => toast.error(error.message || "Invalid username or password"),
  });

  const register = trpc.auth.register.useMutation({
    onSuccess: async (result) => {
      await utils.auth.me.invalidate();
      toast.success(`Account created. Let’s set up your ${result.role} profile.`);
    },
    onError: (error) => toast.error(error.message || "Unable to create account"),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (login.isPending || register.isPending) return;
    const cleanUsername = username.trim();
    if (mode === "login" && cleanUsername.toLowerCase() === "demo" && password === "123456") {
      activateLocalDemoSession();
      toast.success("Demo administrator access enabled.");
      return;
    }
    if (mode === "login") {
      if (!cleanUsername || !password) {
        toast.error("Enter your username and password.");
        return;
      }
      login.mutate({ username: cleanUsername, password, role });
      return;
    }
    if (name.trim().length < 2) {
      toast.error("Enter your full name.");
      return;
    }
    if (cleanUsername.length < 3) {
      toast.error("Username must be at least 3 characters.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    register.mutate({
      username: cleanUsername,
      password,
      name: name.trim(),
      email: email.trim() || undefined,
      role,
    });
  };

  const pending = login.isPending || register.isPending;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-clay px-4 py-8">
      <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-sage/25 blur-3xl" />
      <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-lavender/30 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-peach/20 blur-3xl" />

      <form noValidate onSubmit={submit} className="neu-raised relative z-10 flex w-full max-w-md flex-col items-center gap-5 rounded-[2rem] p-6 sm:p-8">
        <img src={LOGO} alt="KrishAI Hub logo" className="h-24 w-24 rounded-full object-cover shadow-soft-md" />
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold tracking-wide text-ink">KrishAI Hub</h1>
          <p className="font-ui mt-2 text-lg text-muted-foreground">AI-Powered Agriculture Intelligence</p>
        </div>

        <div className="flex w-full rounded-full bg-secondary p-1 text-sm font-semibold">
          <button type="button" onClick={() => setMode("login")} className={`flex-1 rounded-full px-4 py-2 transition ${mode === "login" ? "bg-background text-primary shadow-soft-xs" : "text-muted-foreground"}`}>Sign in</button>
          <button type="button" onClick={() => setMode("register")} className={`flex-1 rounded-full px-4 py-2 transition ${mode === "register" ? "bg-background text-primary shadow-soft-xs" : "text-muted-foreground"}`}>Create account</button>
        </div>

        <p className="max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
          {mode === "register" ? "Create your account, choose your role, and complete a guided profile so your hub is personalized." : "Sign in to your protected agriculture intelligence hub."}
        </p>

        <div className="flex w-full gap-3">
          {([
            { key: "farmer" as const, label: "Farmer", sub: "Farms · Scan · Markets", icon: Tractor },
            { key: "student" as const, label: "Student", sub: "Research · Data · Reports", icon: BookOpen },
          ]).map(({ key, label, sub, icon: Icon }) => (
            <button key={key} type="button" onClick={() => setRole(key)} className={`flex flex-1 flex-col items-center gap-1.5 rounded-2xl px-3 py-3.5 transition-all active:scale-[0.97] ${role === key ? "surface-sage-deep shadow-soft-sm ring-2 ring-primary/60" : "neu-raised opacity-80 hover:opacity-100"}`}>
              <Icon className={`h-5 w-5 ${role === key ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`font-display text-sm font-bold ${role === key ? "text-primary" : "text-foreground"}`}>{label}</span>
              <span className={`text-[10px] leading-tight ${role === key ? "text-primary/80" : "text-muted-foreground"}`}>{sub}</span>
            </button>
          ))}
        </div>

        {mode === "login" ? (
          <div className="neu-pressed flex w-full items-center gap-3 rounded-full px-4 py-3">
            <Lock className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-xs text-muted-foreground">Demo access: username <b>demo</b> · password <b>123456</b></span>
          </div>
        ) : (
          <div className="w-full rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            After registration, you will answer multiple questions about your farm or studies before entering the hub.
          </div>
        )}

        {mode === "register" && (
          <label className="flex w-full flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="neu-input rounded-2xl px-4 py-3 text-ink outline-none" placeholder="e.g. Ramesh Kumar" autoComplete="name" />
          </label>
        )}
        {mode === "register" && (
          <label className="flex w-full flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email (optional)</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="neu-input rounded-2xl px-4 py-3 text-ink outline-none" placeholder="you@example.com" autoComplete="email" />
          </label>
        )}
        <div className="flex w-full flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</span>
            <input type="text" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} className="neu-input rounded-2xl px-4 py-3 text-ink outline-none" placeholder={mode === "login" ? "demo" : "your username"} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</span>
            <input type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="neu-input rounded-2xl px-4 py-3 text-ink outline-none" placeholder={mode === "login" ? "123456" : "At least 8 characters"} />
          </label>
        </div>

        <button type="submit" disabled={pending} className="neu-button btn-vivid-orange w-full rounded-full px-6 py-3.5 font-display text-base font-semibold tracking-wider shadow-soft-sm transition-all active:scale-[0.97] disabled:opacity-60">
          {pending ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {mode === "register" ? "Creating account…" : "Signing in…"}</span> : mode === "register" ? "Create account" : `Enter as ${role === "farmer" ? "Farmer" : "Student"}`}
        </button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Sprout className="h-3.5 w-3.5 text-accent" /><span>Free for everyone · Real data · Futuristic by design</span></div>
      </form>
    </div>
  );
}

export function LogoutButton({ className }: { className?: string }) {
  const utils = trpc.useUtils();
  const logout = trpc.auth.logout.useMutation({ onSuccess: () => utils.auth.me.invalidate() });
  return <button className={`rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground shadow-soft-xs transition-all hover:text-ink active:shadow-inset-sm ${className ?? ""}`} onClick={() => {
    if (isLocalDemoActive()) {
      clearLocalDemoSession();
      return;
    }
    logout.mutate();
  }}>Log out</button>;
}
