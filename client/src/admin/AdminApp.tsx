import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, BellRing, CheckCircle2, Clock3, DatabaseZap, LayoutDashboard, Link2, LogOut, Search, ShieldCheck, Upload, Users } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import AdminPage from "./AdminPage";
import ApprovalsPanel from "./ApprovalsPanel";
import UploadsManager from "./UploadsManager";
import UserDetails360 from "./UserDetails360";

const LOGO = "/manus-storage/krishai-logo-3d_27b8131e.png";

type Section = "overview" | "users" | "approvals" | "uploads" | "user360" | "admin";

/**
 * Dedicated SaaS backoffice shell — a completely separate surface from the
 * customer app: dark control-room styling, its own sidebar, global stats bar.
 */
export function AdminApp() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [section, setSection] = useState<Section>("overview");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const overview = trpc.admin.overview.useQuery(undefined, { refetchInterval: 20000 });

  const goUser360 = (userId: number) => {
    setSelectedUserId(userId);
    setSection("user360");
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "Customers", icon: Users },
    { id: "approvals", label: "Approvals", icon: CheckCircle2 },
    { id: "uploads", label: "Uploaded Data", icon: Upload },
    { id: "user360", label: "Customer 360", icon: Search, hide: selectedUserId === null },
    { id: "admin", label: "Legacy Panel", icon: ShieldCheck, alt: true },
  ];

  return (
    <div className="flex min-h-screen bg-[#0b1020] text-slate-200">
      {/* ---- Admin sidebar ---- */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/8 bg-[#0d1326] md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-white/8 px-4">
          <img src={LOGO} alt="KrishAI" className="h-9 w-9" />
          <div>
            <div className="text-sm font-bold text-white">KrishAI Ops</div>
            <div className="text-[9px] uppercase tracking-[0.25em] text-emerald-400">Control Room</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) =>
            item.hide ? null : (
              <button
                key={item.id}
                onClick={() => setSection(item.id as Section)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  section === item.id
                    ? item.alt
                      ? "bg-rose-500/15 text-rose-300"
                      : "bg-emerald-500/15 text-emerald-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ),
          )}
        </nav>
        <div className="border-t border-white/8 p-3">
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-[11px] font-bold text-emerald-300">
              {(user?.name ?? "A").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-white">{user?.name ?? "Admin"}</div>
              <div className="text-[9px] uppercase tracking-widest text-emerald-400">Administrator</div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-slate-500 hover:text-slate-200" onClick={() => { logout(); setLocation("/"); }}>
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
          <button
            onClick={() => setLocation("/")}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2 text-xs text-slate-400 transition-colors hover:bg-white/5"
          >
            <Link2 className="h-3.5 w-3.5" /> Open customer app
          </button>
        </div>
      </aside>

      {/* ---- Main ---- */}
      <div className="min-h-screen flex-1 md:pl-60">
        <StatsBar />

        <div className="p-4 md:p-8">
          {section === "overview" && <OverviewPanel onOpenUser={goUser360} />}
          {section === "users" && <UsersPanel onOpenUser={goUser360} />}
          {section === "approvals" && <ApprovalsPanel />}
          {section === "uploads" && <UploadsManager />}
          {section === "user360" && selectedUserId !== null && <UserDetails360 userId={selectedUserId} onBack={() => setSection("users")} />}
          {section === "admin" && <AdminPage />}
        </div>
      </div>
    </div>
  );
}

function StatsBar() {
  const overview = trpc.admin.overview.useQuery(undefined, { refetchInterval: 20000 });
  const d = overview.data;
  const stat = (label: string, value: React.ReactNode, accent?: string) => (
    <div className="flex min-w-0 items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
      <span className={`font-display text-lg font-bold ${accent ?? "text-white"}`}>{value ?? "—"}</span>
      <span className="font-ui truncate text-[10px] uppercase tracking-widest text-slate-400">{label}</span>
    </div>
  );
  return (
    <div className="sticky top-0 z-30 hidden items-center gap-3 border-b border-white/8 bg-[#0d1326]/90 px-4 py-3 backdrop-blur md:flex">
      {stat("Total users", d?.roles.total)}
      {stat("Farmers", d?.roles.farmer, "text-emerald-300")}
      {stat("Students", d?.roles.student, "text-sky-300")}
      {stat("Pending approvals", d?.pendingApprovals, "text-amber-300")}
      <div className="ml-auto flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500">
        <Activity className="h-3.5 w-3.5 text-emerald-400" />
        Operator backoffice
      </div>
    </div>
  );
}

function OverviewPanel({ onOpenUser }: { onOpenUser: (id: number) => void }) {
  const overview = trpc.admin.overview.useQuery(undefined, { refetchInterval: 20000 });
  const flags = trpc.admin.featureFlags.useQuery();
  const utils = trpc.useUtils();
  const d = overview.data;
  const f = flags.data;

  const setFlag = trpc.admin.setFeatureFlag.useMutation({
    onSuccess: () => {
      utils.admin.featureFlags.invalidate();
      utils.admin.overview.invalidate();
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-white">
          <ShieldCheck className="h-5 w-5 text-emerald-400" /> Platform Overview
        </h1>
        <p className="text-xs text-slate-400">Live snapshot of the KrishAI Hub platform. Every control here takes effect on the customer app in real time.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total users", value: d?.roles.total, icon: Users, color: "text-white" },
          { label: "Farmers", value: d?.roles.farmer, icon: Users, color: "text-emerald-300" },
          { label: "Students", value: d?.roles.student, icon: Users, color: "text-sky-300" },
          { label: "Pending approvals", value: d?.pendingApprovals, icon: Clock3, color: "text-amber-300" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/8 bg-[#10172e] p-5">
            <s.icon className={`mb-2 h-4 w-4 ${s.color}`} />
            <div className={`font-display text-3xl font-bold ${s.color}`}>{s.value ?? "—"}</div>
            <div className="mt-1 text-[10px] uppercase tracking-widest text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-[#10172e] p-5">
          <h3 className="font-display mb-4 text-xs uppercase tracking-widest text-emerald-300">Module feature flags</h3>
          <p className="mb-4 text-[11px] text-slate-400">Toggle a module off and it disappears from the customer app immediately (customers stay role-gated as well).</p>
          <div className="space-y-2.5">
            {f
              ? (Object.entries(f) as [string, unknown][]).map(([k, v]) => {
                  const on = v === true;
                  return (
                    <div key={k} className="flex items-center justify-between rounded-xl bg-white/5 px-3.5 py-2.5">
                      <span className="font-ui text-xs capitalize text-slate-200">{k.replace(/([A-Z])/g, " $1")}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`h-7 rounded-full px-4 text-[10px] font-semibold ${on ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-rose-400/40 bg-rose-400/10 text-rose-300"}`}
                        onClick={() => setFlag.mutate({ key: k, value: !on })}
                        disabled={setFlag.isPending}
                      >
                        {on ? "ON" : "OFF"}
                      </Button>
                    </div>
                  );
                })
              : null}
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#10172e] p-5">
          <h3 className="font-display mb-4 text-xs uppercase tracking-widest text-emerald-300">Recent customers</h3>
          <div className="space-y-2">
            {d?.recentUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => onOpenUser(u.id)}
                className="flex w-full items-center justify-between rounded-xl bg-white/5 px-3.5 py-2.5 text-left transition-colors hover:bg-white/10"
              >
                <span className="font-ui text-xs text-slate-200">{u.name ?? "—"}</span>
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className={`border-white/10 font-ui text-[9px] ${u.role === "farmer" ? "text-emerald-300" : u.role === "student" ? "text-sky-300" : "text-slate-300"}`}>
                    {(u.role ?? "").toUpperCase()}
                  </Badge>
                </span>
              </button>
            )) ?? null}
          </div>
          <h3 className="font-display mb-3 mt-6 text-xs uppercase tracking-widest text-emerald-300">Recent uploads</h3>
          <div className="space-y-2">
            {d?.recentUploads.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3.5 py-2">
                <span className="font-ui truncate text-[11px] text-slate-300">{f.category ?? f.url.split("/").pop()}</span>
                <span className={`font-display text-[9px] uppercase ${f.status === "approved" ? "text-emerald-300" : f.status === "rejected" ? "text-rose-300" : "text-amber-300"}`}>{f.status}</span>
              </div>
            )) ?? null}
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersPanel({ onOpenUser }: { onOpenUser: (id: number) => void }) {
  const utils = trpc.useUtils();
  const users = trpc.admin.listUsers.useQuery({ limit: 50 });
  const setRole = trpc.admin.setRole.useMutation({ onSuccess: () => { utils.admin.listUsers.invalidate(); }, onError: (e) => console.error(e.message) });
  const suspend = trpc.admin.suspendUser.useMutation({ onSuccess: () => { utils.admin.listUsers.invalidate(); }, onError: (e) => console.error(e.message) });
  const resetOnboarding = trpc.admin.resetOnboarding.useMutation({
    onSuccess: () => { utils.admin.listUsers.invalidate(); },
    onError: (e) => console.error(e.message),
  });
  const deleteUser = trpc.admin.deleteUser.useMutation({ onSuccess: () => { utils.admin.listUsers.invalidate(); }, onError: (e) => console.error(e.message) });
  const [q, setQ] = useState("");

  const filtered = (users.data ?? []).filter((u) =>
    `${u.name ?? ""} ${u.email ?? ""}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-white">
            <Users className="h-5 w-5 text-emerald-400" /> Customers
          </h1>
          <p className="text-xs text-slate-400">Manage roles, suspend accounts, reset onboarding, and open the full 360° view.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email…" className="h-9 w-64 rounded-full border-white/10 bg-white/5 pl-9 text-xs text-slate-200 placeholder:text-slate-500" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#10172e]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8 bg-white/[0.03]">
              {["User", "Email", "Role", "Status", "Signed in", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-display text-[9px] uppercase tracking-widest text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u: any) => (
              <tr key={u.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3 font-ui text-xs font-medium text-slate-100">{u.name || "—"}</td>
                <td className="px-4 py-3 font-ui text-[11px] text-slate-400">{u.email || "—"}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => setRole.mutate({ userId: u.id, role: e.target.value as any })}
                    className="h-8 rounded-lg border border-white/10 bg-[#0b1020] px-2 font-ui text-[11px] text-slate-200"
                  >
                    {["farmer", "student", "researcher", "professional", "business", "admin", "user"].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-display text-[9px] uppercase tracking-widest ${u.role === "suspended" ? "text-rose-300" : "text-emerald-300"}`}>
                    {u.role === "suspended" ? "Suspended" : "Active"}
                  </span>
                </td>
                <td className="px-4 py-3 font-ui text-[10px] text-slate-400">{new Date(u.lastSignedIn).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="ghost" className="h-7 rounded-lg px-2 text-[10px] text-emerald-300" onClick={() => onOpenUser(u.id)}>360 View</Button>
                    <Button size="sm" variant="ghost" className="h-7 rounded-lg px-2 text-[10px] text-slate-300" onClick={() => resetOnboarding.mutate({ userId: u.id })} disabled={resetOnboarding.isPending}>Reset onboarding</Button>
                    <Button size="sm" variant="ghost" className={`h-7 rounded-lg px-2 text-[10px] ${u.role === "suspended" ? "text-emerald-300" : "text-amber-300"}`} onClick={() => suspend.mutate({ userId: u.id, suspend: u.role !== "suspended" })}>
                      {u.role === "suspended" ? "Reactivate" : "Suspend"}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 rounded-lg p-0 text-rose-300" onClick={() => deleteUser.mutate({ userId: u.id })}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
