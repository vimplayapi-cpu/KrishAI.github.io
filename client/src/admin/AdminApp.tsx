import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Activity,
  AlertTriangle,
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  CloudSun,
  Database,
  Download,
  ExternalLink,
  FileText,
  Globe2,
  Leaf,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  Moon,
  MoreHorizontal,
  Palette,
  PanelLeft,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  ToggleLeft,
  ToggleRight,
  Tractor,
  Upload,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const LOGO = `${import.meta.env.BASE_URL}krishai-logo.svg`;

type Section = "overview" | "customers" | "farmer" | "student" | "customer360" | "notifications" | "services" | "content" | "settings";
type Tone = "mint" | "sky" | "amber" | "violet" | "rose";

type Customer = {
  id: number;
  name: string;
  email: string;
  role: "farmer" | "student" | "admin";
  state: string;
  status: "Active" | "Pending" | "Suspended";
  joined: string;
  activity: number;
  profile: string;
};

const customers: Customer[] = [
  { id: 1, name: "Demo Administrator", email: "demo@krishai.local", role: "admin", state: "Platform", status: "Active", joined: "Today", activity: 98, profile: "Operations, approvals, feature flags" },
  { id: 2, name: "Ramesh Kumar", email: "ramesh.farm@example.com", role: "farmer", state: "Maharashtra", status: "Active", joined: "2 days ago", activity: 84, profile: "Cotton, soybean · 18 acres · drip irrigation" },
  { id: 3, name: "Asha Patil", email: "asha.farm@example.com", role: "farmer", state: "Karnataka", status: "Pending", joined: "4 days ago", activity: 61, profile: "Rice, sugarcane · profile review pending" },
  { id: 4, name: "Neha Sharma", email: "neha.study@example.com", role: "student", state: "Delhi", status: "Active", joined: "1 week ago", activity: 76, profile: "Agricultural sciences · crop disease research" },
  { id: 5, name: "Arjun Mehta", email: "arjun.study@example.com", role: "student", state: "Telangana", status: "Active", joined: "2 weeks ago", activity: 54, profile: "Data science · remote sensing" },
  { id: 6, name: "Sanjay Rao", email: "sanjay.farm@example.com", role: "farmer", state: "Andhra Pradesh", status: "Suspended", joined: "3 weeks ago", activity: 19, profile: "Groundnut · verification required" },
];

const usageData = [
  { day: "Mon", users: 482, scans: 212, reports: 89 },
  { day: "Tue", users: 536, scans: 248, reports: 102 },
  { day: "Wed", users: 598, scans: 285, reports: 118 },
  { day: "Thu", users: 640, scans: 312, reports: 131 },
  { day: "Fri", users: 724, scans: 354, reports: 146 },
  { day: "Sat", users: 812, scans: 405, reports: 177 },
  { day: "Sun", users: 886, scans: 452, reports: 203 },
];

const stateData = [
  { state: "Maharashtra", farmers: 432, students: 188, color: "#71e6b0" },
  { state: "Karnataka", farmers: 318, students: 142, color: "#79c8ff" },
  { state: "Telangana", farmers: 276, students: 119, color: "#f7c768" },
  { state: "Punjab", farmers: 241, students: 97, color: "#b69cff" },
  { state: "Delhi", farmers: 83, students: 206, color: "#ff8da1" },
];

const pieData = [
  { name: "Farmers", value: 1250, color: "#71e6b0" },
  { name: "Students", value: 752, color: "#79c8ff" },
  { name: "Admins", value: 12, color: "#f7c768" },
];

const initialServices = [
  { key: "weather", name: "Weather intelligence", desc: "Forecasts, alerts and rainfall signals", on: true, icon: CloudSun },
  { key: "vision", name: "AI crop vision", desc: "Disease scanning and crop diagnosis", on: true, icon: Sparkles },
  { key: "mandi", name: "Live mandi prices", desc: "Market rates and price movement", on: true, icon: Activity },
  { key: "advisor", name: "AI agriculture advisor", desc: "Guided recommendations and chat", on: true, icon: Leaf },
  { key: "research", name: "Research workspace", desc: "Reports, datasets and student tools", on: true, icon: Database },
  { key: "uploads", name: "File uploads", desc: "Profile, scan and research attachments", on: false, icon: Upload },
];

const navItems: { id: Section; label: string; icon: typeof LayoutDashboard; badge?: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "customers", label: "All accounts", icon: Users, badge: "2k" },
  { id: "farmer", label: "Farmers", icon: Tractor },
  { id: "student", label: "Students", icon: UserCheck },
  { id: "customer360", label: "Customer 360", icon: Search },
  { id: "notifications", label: "Notifications", icon: Bell, badge: "7" },
  { id: "services", label: "Services", icon: Zap },
  { id: "content", label: "App content", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings2 },
];

function readSetting<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(`krishai-admin-${key}`);
    return value ? JSON.parse(value) as T : fallback;
  } catch { return fallback; }
}

function saveSetting(key: string, value: unknown) {
  try { localStorage.setItem(`krishai-admin-${key}`, JSON.stringify(value)); } catch {}
}

function chartTooltip() {
  return { contentStyle: { background: "#111a32", border: "1px solid rgba(148,163,184,.18)", borderRadius: 12, color: "#eef4ff" }, itemStyle: { color: "#dbeafe" }, labelStyle: { color: "#8ea0bc" } };
}

export function AdminApp() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [section, setSection] = useState<Section>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [compact, setCompact] = useState(() => readSetting("compact", false));
  const [theme, setTheme] = useState<"dark" | "light">(() => readSetting("theme", "dark"));
  const [accent, setAccent] = useState(() => readSetting("accent", "mint"));
  const [services, setServices] = useState(() => readSetting("services", initialServices));
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(customers[1]);
  const [toast, setToast] = useState("");

  useEffect(() => { saveSetting("compact", compact); }, [compact]);
  useEffect(() => { saveSetting("theme", theme); document.documentElement.dataset.adminTheme = theme; }, [theme]);
  useEffect(() => { saveSetting("accent", accent); }, [accent]);
  useEffect(() => { saveSetting("services", services); }, [services]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectSection = (next: Section) => { setSection(next); setMobileOpen(false); };
  const toggleService = (key: string) => {
    setServices((items: typeof initialServices) => items.map((item) => item.key === key ? { ...item, on: !item.on } : item));
    setToast("Service setting saved for the demo workspace");
  };
  const openCustomer = (customer: Customer) => { setSelectedCustomer(customer); selectSection("customer360"); };

  const themeClass = theme === "light" ? "admin-light" : "admin-dark";
  return (
    <div className={`${themeClass} admin-shell min-h-screen overflow-x-hidden bg-[#091020] text-slate-100`} data-accent={accent}>
      <div className="admin-field-bg" aria-hidden="true"><span /><span /><span /><span /></div>
      <header className="admin-topbar sticky top-0 z-50 border-b border-white/10 bg-[#0b1428]/85 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-7">
          <button className="rounded-xl p-2 text-slate-300 hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
          <img src={LOGO} alt="KrishAI Hub" className="h-9 w-9 rounded-xl" />
          <div className="min-w-0"><div className="truncate text-sm font-bold tracking-wide">KrishAI <span className="text-emerald-300">Ops</span></div><div className="hidden text-[9px] uppercase tracking-[.24em] text-slate-400 sm:block">Agriculture intelligence control room</div></div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400 md:flex"><Search className="h-3.5 w-3.5" /><span>Search anything</span><kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">⌘ K</kbd></div>
            <button className="relative rounded-xl p-2 text-slate-300 hover:bg-white/10" onClick={() => selectSection("notifications")} aria-label="Notifications"><Bell className="h-4 w-4" /><span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-rose-400" /></button>
            <button className="hidden rounded-xl p-2 text-slate-300 hover:bg-white/10 sm:block" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/20 text-xs font-bold text-emerald-200">{(user?.name ?? "D").slice(0, 1)}</div><div className="hidden pr-1 sm:block"><div className="max-w-[110px] truncate text-[11px] font-semibold">{user?.name ?? "Demo Administrator"}</div><div className="text-[9px] uppercase tracking-widest text-emerald-300">Administrator</div></div></div>
          </div>
        </div>
      </header>

      <div className="relative flex">
        <aside className={`admin-sidebar fixed inset-y-0 left-0 z-[60] w-72 border-r border-white/10 bg-[#0b1428]/95 p-4 backdrop-blur-xl transition-transform lg:sticky lg:top-16 lg:z-30 lg:h-[calc(100vh-4rem)] lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="mb-5 flex items-center justify-between lg:hidden"><span className="text-xs font-bold uppercase tracking-widest text-slate-400">Navigation</span><button onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></button></div>
          <div className="mb-4 rounded-2xl border border-emerald-300/15 bg-gradient-to-br from-emerald-300/10 to-sky-300/5 p-3"><div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-emerald-300"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />Demo workspace</div><div className="text-xs text-slate-300">All changes are saved locally and ready for API wiring.</div></div>
          <nav className="space-y-1">{navItems.map((item) => <button key={item.id} onClick={() => selectSection(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-all ${section === item.id ? "bg-emerald-300/15 text-emerald-200 shadow-[inset_3px_0_0_#71e6b0]" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"}`}><item.icon className="h-4 w-4 shrink-0" /><span className="flex-1">{item.label}</span>{item.badge && <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-400">{item.badge}</span>}</button>)}</nav>
          <div className="mt-6 border-t border-white/10 pt-4"><div className="mb-2 px-3 text-[9px] uppercase tracking-widest text-slate-500">Workspace</div><button onClick={() => setCompact(!compact)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-slate-400 hover:bg-white/5"><PanelLeft className="h-4 w-4" />{compact ? "Comfortable density" : "Compact density"}</button><button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-slate-400 hover:bg-white/5">{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}Switch to {theme === "dark" ? "light" : "dark"}</button></div>
          <div className="absolute bottom-4 left-4 right-4 space-y-2"><button onClick={() => setLocation("/")} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-xs text-slate-400 hover:bg-white/5"><ExternalLink className="h-3.5 w-3.5" />Open customer app</button><button onClick={() => { logout(); setLocation("/"); }} className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs text-slate-500 hover:bg-rose-400/10 hover:text-rose-200"><LogOut className="h-3.5 w-3.5" />Sign out</button></div>
        </aside>
        {mobileOpen && <button className="fixed inset-0 z-50 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}

        <main className={`relative min-w-0 flex-1 ${compact ? "p-4 lg:p-6" : "p-4 lg:p-8"}`}>
          <div className="mx-auto max-w-[1600px]">
            {section === "overview" && <Overview onNavigate={selectSection} onOpenCustomer={openCustomer} />}
            {section === "customers" && <CustomersPanel onOpenCustomer={openCustomer} filter="all" />}
            {section === "farmer" && <CustomersPanel onOpenCustomer={openCustomer} filter="farmer" />}
            {section === "student" && <CustomersPanel onOpenCustomer={openCustomer} filter="student" />}
            {section === "customer360" && <Customer360 customer={selectedCustomer} onBack={() => selectSection("customers")} />}
            {section === "notifications" && <NotificationsPanel onToast={setToast} />}
            {section === "services" && <ServicesPanel services={services} onToggle={toggleService} />}
            {section === "content" && <ContentPanel onToast={setToast} />}
            {section === "settings" && <SettingsPanel theme={theme} setTheme={setTheme} accent={accent} setAccent={setAccent} compact={compact} setCompact={setCompact} onToast={setToast} />}
          </div>
        </main>
      </div>
      {toast && <div className="fixed bottom-5 right-5 z-[100] flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-[#13253a] px-4 py-3 text-xs text-emerald-100 shadow-2xl"><Check className="h-4 w-4 text-emerald-300" />{toast}</div>}
    </div>
  );
}

function SectionHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 text-[10px] font-bold uppercase tracking-[.24em] text-emerald-300">{eyebrow}</div><h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p></div>{action}</div>;
}

function Metric({ label, value, delta, icon: Icon, tone = "mint" }: { label: string; value: string; delta: string; icon: typeof Users; tone?: Tone }) {
  const tones: Record<Tone, string> = { mint: "text-emerald-300 bg-emerald-300/10", sky: "text-sky-300 bg-sky-300/10", amber: "text-amber-300 bg-amber-300/10", violet: "text-violet-300 bg-violet-300/10", rose: "text-rose-300 bg-rose-300/10" };
  return <div className="admin-card group rounded-2xl border border-white/10 bg-[#101a31]/90 p-4 transition-transform hover:-translate-y-0.5 sm:p-5"><div className="flex items-start justify-between"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="h-4 w-4" /></div><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${tones[tone]}`}>{delta}</span></div><div className="mt-5 text-2xl font-bold text-white sm:text-3xl">{value}</div><div className="mt-1 text-[10px] uppercase tracking-[.18em] text-slate-500">{label}</div></div>;
}

function Panel({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return <section className={`admin-card rounded-2xl border border-white/10 bg-[#101a31]/90 p-4 sm:p-5 ${className}`}><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-sm font-semibold text-white">{title}</h2>{subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}</div><button className="rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-slate-200"><MoreHorizontal className="h-4 w-4" /></button></div>{children}</section>;
}

function Overview({ onNavigate, onOpenCustomer }: { onNavigate: (section: Section) => void; onOpenCustomer: (customer: Customer) => void }) {
  return <div className="space-y-6"><SectionHeader eyebrow="Live command deck" title="Platform overview" description="Monitor people, services, crop intelligence and operational risk from one calm control room." action={<div className="flex gap-2"><Button onClick={() => onNavigate("settings")} variant="outline" className="border-white/10 bg-white/5 text-xs text-slate-200 hover:bg-white/10"><Settings2 className="mr-2 h-3.5 w-3.5" />Configure</Button><Button onClick={() => onNavigate("customers")} className="bg-emerald-300 text-slate-950 hover:bg-emerald-200"><Users className="mr-2 h-3.5 w-3.5" />View accounts</Button></div>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Total accounts" value="2,014" delta="+12.8%" icon={Users} /><Metric label="Active farmers" value="1,250" delta="+8.4%" icon={Tractor} tone="mint" /><Metric label="Student community" value="752" delta="+15.2%" icon={UserCheck} tone="sky" /><Metric label="Pending actions" value="37" delta="Needs review" icon={AlertTriangle} tone="amber" /></div>
    <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]"><Panel title="Platform activity" subtitle="Accounts, scans and reports · last 7 days" className="min-h-[330px]"><ResponsiveContainer width="100%" height={250}><AreaChart data={usageData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}><defs><linearGradient id="usersFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#71e6b0" stopOpacity={.35} /><stop offset="100%" stopColor="#71e6b0" stopOpacity={0} /></linearGradient><linearGradient id="scansFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#79c8ff" stopOpacity={.3} /><stop offset="100%" stopColor="#79c8ff" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="rgba(148,163,184,.1)" vertical={false} /><XAxis dataKey="day" tick={{ fill: "#71819d", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#71819d", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip {...chartTooltip()} /><Area type="monotone" dataKey="users" stroke="#71e6b0" strokeWidth={2} fill="url(#usersFill)" /><Area type="monotone" dataKey="scans" stroke="#79c8ff" strokeWidth={2} fill="url(#scansFill)" /></AreaChart></ResponsiveContainer><div className="flex flex-wrap gap-4 text-[10px] text-slate-400"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-300" />Active accounts</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-sky-300" />Crop scans</span></div></Panel><Panel title="Account mix" subtitle="Role distribution across the platform"><div className="flex items-center justify-center"><ResponsiveContainer width="100%" height={190}><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={78} paddingAngle={4} stroke="none">{pieData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip {...chartTooltip()} /></PieChart></ResponsiveContainer></div><div className="grid grid-cols-3 gap-2">{pieData.map((item) => <div key={item.name} className="text-center"><div className="text-base font-bold text-white">{item.value.toLocaleString()}</div><div className="mt-1 text-[9px] uppercase tracking-widest text-slate-500">{item.name}</div></div>)}</div></Panel></div>
    <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr_1fr]"><Panel title="Accounts by state" subtitle="Farmer and student reach"><ResponsiveContainer width="100%" height={220}><BarChart data={stateData} layout="vertical" margin={{ top: 0, right: 5, left: 24, bottom: 0 }}><CartesianGrid stroke="rgba(148,163,184,.08)" horizontal={false} /><XAxis type="number" hide /><YAxis type="category" dataKey="state" tick={{ fill: "#8ea0bc", fontSize: 10 }} axisLine={false} tickLine={false} width={80} /><Tooltip {...chartTooltip()} /><Bar dataKey="farmers" stackId="a" fill="#71e6b0" radius={[0, 4, 4, 0]} /><Bar dataKey="students" stackId="a" fill="#79c8ff" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></Panel><Panel title="Service health" subtitle="Live status of customer-facing modules"><div className="space-y-3">{initialServices.slice(0, 5).map((item) => <div key={item.key} className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-300/10 text-emerald-300"><item.icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="truncate text-xs text-slate-200">{item.name}</div><div className="text-[10px] text-slate-500">{item.desc}</div></div><span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_#71e6b0]" /></div>)}</div></Panel><Panel title="Live activity" subtitle="Most recent operator events"><div className="space-y-3">{["Demo admin opened Customer 360", "AI vision service health check passed", "New farmer onboarding completed", "Mandi feed synchronized"].map((event, index) => <div key={event} className="flex gap-3"><div className="mt-1 h-2 w-2 rounded-full bg-sky-300" /><div><div className="text-xs text-slate-300">{event}</div><div className="mt-1 text-[10px] text-slate-500">{index + 1} hour{index ? "s" : ""} ago</div></div></div>)}</div></Panel></div>
    <Panel title="Priority accounts" subtitle="Profiles that may need operator attention"><div className="divide-y divide-white/5">{customers.filter((item) => item.status !== "Active").map((customer) => <button key={customer.id} onClick={() => onOpenCustomer(customer)} className="flex w-full items-center gap-3 py-3 text-left hover:bg-white/[.03]"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-xs font-bold text-slate-200">{customer.name.split(" ").map((part) => part[0]).join("")}</div><div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold text-slate-200">{customer.name}</div><div className="truncate text-[10px] text-slate-500">{customer.profile}</div></div><span className={`rounded-full px-2 py-1 text-[9px] uppercase tracking-widest ${customer.status === "Pending" ? "bg-amber-300/10 text-amber-300" : "bg-rose-300/10 text-rose-300"}`}>{customer.status}</span><ChevronRight className="h-4 w-4 text-slate-600" /></button>)}</div></Panel>
  </div>;
}

function CustomersPanel({ filter, onOpenCustomer }: { filter: "all" | "farmer" | "student"; onOpenCustomer: (customer: Customer) => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All status");
  const rows = customers.filter((customer) => (filter === "all" || customer.role === filter) && (status === "All status" || customer.status === status) && `${customer.name} ${customer.email} ${customer.state}`.toLowerCase().includes(query.toLowerCase()));
  const title = filter === "farmer" ? "Farmer network" : filter === "student" ? "Student community" : "All accounts";
  return <div className="space-y-6"><SectionHeader eyebrow="People & profiles" title={title} description="Review account health, roles, location, activity and onboarding status. Open any record for a full Customer 360 profile." action={<Button className="bg-emerald-300 text-slate-950 hover:bg-emerald-200"><Users className="mr-2 h-3.5 w-3.5" />Invite account</Button>} /><div className="grid gap-3 sm:grid-cols-3"><Metric label="Visible accounts" value={rows.length.toString()} delta="This view" icon={Users} /><Metric label="Active profiles" value={rows.filter((r) => r.status === "Active").length.toString()} delta="Healthy" icon={UserCheck} tone="mint" /><Metric label="Needs attention" value={rows.filter((r) => r.status !== "Active").length.toString()} delta="Review queue" icon={AlertTriangle} tone="amber" /></div><Panel title="Account directory" subtitle="Search and manage customer records"><div className="mb-4 flex flex-wrap gap-2"><div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or state" className="h-10 border-white/10 bg-white/5 pl-9 text-xs text-white placeholder:text-slate-500" /></div><select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-xl border border-white/10 bg-[#0d172c] px-3 text-xs text-slate-300"><option>All status</option><option>Active</option><option>Pending</option><option>Suspended</option></select><Button variant="outline" className="h-10 border-white/10 bg-white/5 text-xs text-slate-300"><Download className="mr-2 h-3.5 w-3.5" />Export</Button></div><div className="overflow-x-auto"><table className="w-full min-w-[720px]"><thead><tr className="border-b border-white/10 text-left text-[9px] uppercase tracking-widest text-slate-500">{["Account", "Role", "Location", "Status", "Activity", "Joined", ""].map((head) => <th key={head} className="px-3 py-3 font-medium">{head}</th>)}</tr></thead><tbody className="divide-y divide-white/5">{rows.map((customer) => <tr key={customer.id} className="group hover:bg-white/[.03]"><td className="px-3 py-3"><button onClick={() => onOpenCustomer(customer)} className="flex items-center gap-3 text-left"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-300/20 to-sky-300/20 text-[10px] font-bold text-slate-200">{customer.name.split(" ").map((part) => part[0]).join("")}</div><div><div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-200">{customer.name}</div><div className="text-[10px] text-slate-500">{customer.email}</div></div></button></td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-[9px] uppercase tracking-widest ${customer.role === "farmer" ? "bg-emerald-300/10 text-emerald-300" : customer.role === "student" ? "bg-sky-300/10 text-sky-300" : "bg-amber-300/10 text-amber-300"}`}>{customer.role}</span></td><td className="px-3 py-3 text-xs text-slate-400">{customer.state}</td><td className="px-3 py-3"><span className={`text-[10px] ${customer.status === "Active" ? "text-emerald-300" : customer.status === "Pending" ? "text-amber-300" : "text-rose-300"}`}><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />{customer.status}</span></td><td className="px-3 py-3"><div className="flex items-center gap-2"><div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-300" style={{ width: `${customer.activity}%` }} /></div><span className="text-[10px] text-slate-400">{customer.activity}%</span></div></td><td className="px-3 py-3 text-[10px] text-slate-500">{customer.joined}</td><td className="px-3 py-3 text-right"><button onClick={() => onOpenCustomer(customer)} className="rounded-lg p-2 text-slate-500 hover:bg-white/10 hover:text-white"><ChevronRight className="h-4 w-4" /></button></td></tr>)}</tbody></table></div></Panel></div>;
}

function Customer360({ customer, onBack }: { customer: Customer; onBack: () => void }) {
  return <div className="space-y-6"><SectionHeader eyebrow="Customer 360" title={customer.name} description="A complete operational view of identity, role, onboarding, engagement, crop context and support history." action={<Button onClick={onBack} variant="outline" className="border-white/10 bg-white/5 text-xs text-slate-200">Back to accounts</Button>} /><div className="grid gap-5 xl:grid-cols-[1fr_1.4fr]"><Panel title="Identity & access" subtitle="Account security and permissions"><div className="flex items-center gap-4 border-b border-white/10 pb-5"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300/30 to-sky-300/20 text-xl font-bold text-white">{customer.name.split(" ").map((part) => part[0]).join("")}</div><div><h2 className="text-lg font-semibold text-white">{customer.name}</h2><p className="text-xs text-slate-400">{customer.email}</p><div className="mt-2 flex gap-2"><span className="rounded-full bg-emerald-300/10 px-2 py-1 text-[9px] uppercase tracking-widest text-emerald-300">{customer.role}</span><span className="rounded-full bg-sky-300/10 px-2 py-1 text-[9px] uppercase tracking-widest text-sky-300">{customer.status}</span></div></div></div><div className="grid grid-cols-2 gap-4 pt-5 text-xs"><div><div className="mb-1 text-[9px] uppercase tracking-widest text-slate-500">State</div><div className="text-slate-200">{customer.state}</div></div><div><div className="mb-1 text-[9px] uppercase tracking-widest text-slate-500">Joined</div><div className="text-slate-200">{customer.joined}</div></div><div><div className="mb-1 text-[9px] uppercase tracking-widest text-slate-500">Profile completion</div><div className="text-slate-200">{customer.activity}%</div></div><div><div className="mb-1 text-[9px] uppercase tracking-widest text-slate-500">Last action</div><div className="text-slate-200">Today, 10:42 AM</div></div></div><div className="mt-5 flex gap-2"><Button className="bg-emerald-300 text-slate-950 hover:bg-emerald-200 text-xs"><UserCheck className="mr-2 h-3.5 w-3.5" />Approve profile</Button><Button variant="outline" className="border-white/10 bg-white/5 text-xs text-slate-300"><LockKeyhole className="mr-2 h-3.5 w-3.5" />Reset access</Button></div></Panel><Panel title="Profile intelligence" subtitle="Signals assembled from onboarding and activity"><div className="rounded-xl bg-white/5 p-4"><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-200"><Sparkles className="h-4 w-4" />AI profile summary</div><p className="text-sm leading-6 text-slate-300">{customer.profile}. Engagement is trending positively; recommend a personalized crop advisory notification and a profile completion reminder.</p></div><div className="mt-4 grid gap-3 sm:grid-cols-3">{[{ label: "Sessions", value: "42", tone: "text-emerald-300" }, { label: "Scans", value: customer.role === "farmer" ? "18" : "6", tone: "text-sky-300" }, { label: "Reports", value: "11", tone: "text-violet-300" }].map((item) => <div key={item.label} className="rounded-xl border border-white/10 bg-white/[.03] p-3"><div className={`text-xl font-bold ${item.tone}`}>{item.value}</div><div className="mt-1 text-[9px] uppercase tracking-widest text-slate-500">{item.label}</div></div>)}</div><div className="mt-5"><div className="mb-2 flex justify-between text-[10px] uppercase tracking-widest text-slate-500"><span>Engagement pulse</span><span>{customer.activity}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-sky-300" style={{ width: `${customer.activity}%` }} /></div></div></Panel></div><div className="grid gap-5 xl:grid-cols-2"><Panel title="Activity timeline" subtitle="Recent events for this customer"><div className="space-y-4">{["Profile viewed by operator", "Completed onboarding checkpoint", "Opened AI advisor", "Signed in from mobile Safari", "Received weather alert"].map((event, index) => <div key={event} className="flex gap-3"><div className="relative flex w-4 justify-center"><span className="z-10 mt-1 h-2 w-2 rounded-full bg-emerald-300" />{index < 4 && <span className="absolute top-3 h-full w-px bg-white/10" />}</div><div className="pb-1"><div className="text-xs text-slate-300">{event}</div><div className="mt-1 text-[10px] text-slate-500">{index * 3 + 1} hours ago</div></div></div>)}</div></Panel><Panel title="Support & compliance" subtitle="Operator actions"><div className="space-y-2">{["Identity verified", "Role assignment reviewed", "Privacy consent recorded", "No security incidents"].map((item) => <div key={item} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-xs text-slate-300"><Check className="h-3.5 w-3.5 text-emerald-300" />{item}<span className="ml-auto text-[9px] uppercase tracking-widest text-emerald-300">Clear</span></div>)}</div></Panel></div></div>;
}

function NotificationsPanel({ onToast }: { onToast: (value: string) => void }) {
  const [filter, setFilter] = useState("All");
  const notifications = [{ title: "Mandi price feed delayed", desc: "The Maharashtra market feed is 12 minutes behind schedule.", type: "Warning", time: "8 min ago", tone: "amber" }, { title: "New farmer onboarding", desc: "Asha Patil completed 80% of her profile setup.", type: "Account", time: "24 min ago", tone: "mint" }, { title: "AI vision service healthy", desc: "Crop image processing latency returned to normal.", type: "System", time: "1 hour ago", tone: "sky" }, { title: "Approval queue growing", desc: "12 new research uploads are waiting for review.", type: "Action", time: "2 hours ago", tone: "violet" }, { title: "Weekly digest ready", desc: "Your platform engagement report is ready to download.", type: "Report", time: "Yesterday", tone: "rose" }];
  const filtered = filter === "All" ? notifications : notifications.filter((item) => item.type === filter);
  return <div className="space-y-6"><SectionHeader eyebrow="Signal center" title="Notifications" description="Keep the operator team ahead of service health, account activity and regional events." action={<Button onClick={() => onToast("All notifications marked as read")} variant="outline" className="border-white/10 bg-white/5 text-xs text-slate-300"><Check className="mr-2 h-3.5 w-3.5" />Mark all read</Button>} /><div className="flex gap-2 overflow-x-auto pb-1">{["All", "Warning", "Account", "System", "Action", "Report"].map((item) => <button key={item} onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs ${filter === item ? "bg-emerald-300 text-slate-950" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>{item}</button>)}</div><Panel title="Operator inbox" subtitle={`${filtered.length} signals require your attention`}><div className="divide-y divide-white/5">{filtered.map((item) => <div key={item.title} className="flex gap-3 py-4"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.tone === "amber" ? "bg-amber-300/10 text-amber-300" : item.tone === "mint" ? "bg-emerald-300/10 text-emerald-300" : item.tone === "sky" ? "bg-sky-300/10 text-sky-300" : item.tone === "violet" ? "bg-violet-300/10 text-violet-300" : "bg-rose-300/10 text-rose-300"}`}><Bell className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><div className="text-sm font-semibold text-slate-200">{item.title}</div><span className="rounded-full bg-white/5 px-2 py-1 text-[9px] uppercase tracking-widest text-slate-500">{item.type}</span></div><p className="mt-1 text-xs leading-5 text-slate-500">{item.desc}</p></div><div className="whitespace-nowrap text-[10px] text-slate-500">{item.time}</div></div>)}</div></Panel></div>;
}

function ServicesPanel({ services, onToggle }: { services: typeof initialServices; onToggle: (key: string) => void }) {
  return <div className="space-y-6"><SectionHeader eyebrow="Feature control" title="Services & feature flags" description="Turn customer-facing modules on or off, inspect health and stage changes before connecting them to the production API." action={<div className="flex items-center gap-2 rounded-xl bg-emerald-300/10 px-3 py-2 text-xs text-emerald-200"><span className="h-2 w-2 rounded-full bg-emerald-300" />All systems nominal</div>} /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{services.map((service) => <div key={service.key} className="admin-card rounded-2xl border border-white/10 bg-[#101a31]/90 p-5"><div className="flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-300"><service.icon className="h-5 w-5" /></div><button onClick={() => onToggle(service.key)} className={service.on ? "text-emerald-300" : "text-slate-600"} aria-label={`Toggle ${service.name}`}>{service.on ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8" />}</button></div><h2 className="mt-5 text-sm font-semibold text-white">{service.name}</h2><p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">{service.desc}</p><div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3"><span className={`text-[10px] uppercase tracking-widest ${service.on ? "text-emerald-300" : "text-slate-500"}`}>{service.on ? "Live for customers" : "Paused"}</span><span className="text-[10px] text-slate-500">Demo setting</span></div></div>)}</div><Panel title="Change history" subtitle="Every switch should be auditable when the API is connected"><div className="space-y-2">{["Weather intelligence enabled by Demo Administrator", "File uploads paused for review", "AI agriculture advisor configuration saved"].map((event, index) => <div key={event} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3 text-xs text-slate-300"><Activity className="h-3.5 w-3.5 text-emerald-300" />{event}<span className="ml-auto text-[10px] text-slate-500">{index + 1}h ago</span></div>)}</div></Panel></div>;
}

function ContentPanel({ onToast }: { onToast: (value: string) => void }) {
  const [headline, setHeadline] = useState("AI agriculture intelligence for every field");
  const [notice, setNotice] = useState("Weather alerts are active for Maharashtra, Karnataka and Telangana.");
  return <div className="space-y-6"><SectionHeader eyebrow="Customer experience" title="App content & messaging" description="Control the words, announcements, banners and guidance that customers see across farmer and student surfaces." action={<Button onClick={() => onToast("Content draft saved locally")} className="bg-emerald-300 text-slate-950 hover:bg-emerald-200"><Check className="mr-2 h-3.5 w-3.5" />Save draft</Button>} /><div className="grid gap-5 xl:grid-cols-2"><Panel title="Public home messaging" subtitle="Hero copy shown on the customer app"><label className="mb-2 block text-[10px] uppercase tracking-widest text-slate-500">Main headline</label><Input value={headline} onChange={(e) => setHeadline(e.target.value)} className="mb-4 border-white/10 bg-white/5 text-sm text-white" /><label className="mb-2 block text-[10px] uppercase tracking-widest text-slate-500">Weather notice</label><textarea value={notice} onChange={(e) => setNotice(e.target.value)} className="min-h-28 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none ring-emerald-300/30 focus:ring-2" /><div className="mt-4 rounded-xl border border-emerald-300/15 bg-emerald-300/5 p-4"><div className="mb-2 text-[9px] uppercase tracking-widest text-emerald-300">Preview</div><div className="text-lg font-semibold text-white">{headline}</div><div className="mt-2 text-xs leading-5 text-slate-400">{notice}</div></div></Panel><Panel title="Role-specific guidance" subtitle="Manage prompts for farmer and student journeys"><div className="space-y-3">{[{ label: "Farmer onboarding helper", value: "Add your first field to unlock crop lifecycle insights." }, { label: "Student research helper", value: "Choose a research area to personalize reports and data." }, { label: "Admin alert banner", value: "All demo services are running in local workspace mode." }].map((item) => <div key={item.label} className="rounded-xl border border-white/10 bg-white/[.03] p-3"><div className="mb-2 text-xs font-semibold text-slate-200">{item.label}</div><div className="text-xs leading-5 text-slate-500">{item.value}</div><button onClick={() => onToast(`${item.label} editor opened`)} className="mt-3 text-[10px] uppercase tracking-widest text-emerald-300 hover:text-emerald-200">Edit text <ChevronRight className="inline h-3 w-3" /></button></div>)}</div></Panel></div></div>;
}

function SettingsPanel({ theme, setTheme, accent, setAccent, compact, setCompact, onToast }: { theme: "dark" | "light"; setTheme: (value: "dark" | "light") => void; accent: string; setAccent: (value: string) => void; compact: boolean; setCompact: (value: boolean) => void; onToast: (value: string) => void }) {
  return <div className="space-y-6"><SectionHeader eyebrow="Workspace preferences" title="Admin settings" description="Tune the operator experience, accessibility, data refresh behavior and visual language of the control room." action={<Button onClick={() => onToast("Settings saved locally")} className="bg-emerald-300 text-slate-950 hover:bg-emerald-200"><Check className="mr-2 h-3.5 w-3.5" />Save settings</Button>} /><div className="grid gap-5 xl:grid-cols-2"><Panel title="Appearance" subtitle="Theme, density and accent color"><div className="space-y-5"><div><div className="mb-2 text-xs font-semibold text-slate-200">Theme</div><div className="grid grid-cols-2 gap-3"><button onClick={() => setTheme("dark")} className={`flex items-center gap-3 rounded-xl border p-3 text-left ${theme === "dark" ? "border-emerald-300/50 bg-emerald-300/10" : "border-white/10 bg-white/5"}`}><Moon className="h-4 w-4 text-sky-300" /><span className="text-xs text-slate-200">Dark control room</span></button><button onClick={() => setTheme("light")} className={`flex items-center gap-3 rounded-xl border p-3 text-left ${theme === "light" ? "border-emerald-300/50 bg-emerald-300/10" : "border-white/10 bg-white/5"}`}><Sun className="h-4 w-4 text-amber-300" /><span className="text-xs text-slate-200">Light workspace</span></button></div></div><div><div className="mb-2 text-xs font-semibold text-slate-200">Accent system</div><div className="flex flex-wrap gap-2">{[{ key: "mint", color: "bg-emerald-300" }, { key: "sky", color: "bg-sky-300" }, { key: "amber", color: "bg-amber-300" }, { key: "violet", color: "bg-violet-300" }, { key: "rose", color: "bg-rose-300" }].map((item) => <button key={item.key} onClick={() => setAccent(item.key)} className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs capitalize ${accent === item.key ? "border-white/40 bg-white/10 text-white" : "border-white/10 text-slate-500"}`}><span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />{item.key}</button>)}</div></div><label className="flex items-center justify-between rounded-xl bg-white/5 p-3"><span><span className="block text-xs font-semibold text-slate-200">Compact data density</span><span className="mt-1 block text-[10px] text-slate-500">Fit more rows and signals on small screens</span></span><button onClick={() => setCompact(!compact)} className="text-emerald-300">{compact ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8" />}</button></label></div></Panel><Panel title="Security & data" subtitle="Operator safeguards and refresh controls"><div className="space-y-3">{[{ icon: ShieldCheck, label: "Two-step approval actions", desc: "Require confirmation for destructive changes", on: true }, { icon: Database, label: "Automatic data refresh", desc: "Refresh dashboard metrics every 20 seconds", on: true }, { icon: LockKeyhole, label: "Session timeout", desc: "Sign out inactive operators after 30 minutes", on: false }, { icon: Globe2, label: "Regional data mode", desc: "Show India state and market context", on: true }].map((item) => <div key={item.label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] p-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-300"><item.icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="text-xs font-semibold text-slate-200">{item.label}</div><div className="mt-1 text-[10px] text-slate-500">{item.desc}</div></div><div className={`h-2 w-2 rounded-full ${item.on ? "bg-emerald-300" : "bg-slate-600"}`} /></div>)}</div></Panel></div><Panel title="API readiness" subtitle="The demo controls are structured for backend integration"><div className="grid gap-3 sm:grid-cols-3">{[{ title: "Admin overview", text: "Metrics, role counts, states and activity" }, { title: "Customer 360", text: "Identity, profile, events and approvals" }, { title: "Feature flags", text: "Service switches and audit history" }].map((item) => <div key={item.title} className="rounded-xl bg-white/5 p-4"><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-200"><SlidersHorizontal className="h-3.5 w-3.5" />{item.title}</div><div className="text-[11px] leading-5 text-slate-500">{item.text}</div></div>)}</div></Panel></div>;
}
