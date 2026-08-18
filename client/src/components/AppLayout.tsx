import { useAuth } from "@/_core/hooks/useAuth";
import { LogoutButton } from "@/components/LoginGate";
import { NeumorphicCard } from "@/components/Neumorphic";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  Activity,
  Bell,
  BookOpen,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Leaf,
  Microscope,
  Newspaper,
  Package,
  Radar,
  ScrollText,
  User,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const LOGO = "/manus-storage/krishai-logo-3d_27b8131e.png";

const NAV = [
  { icon: Activity, label: "Dashboard", path: "/" },
  { icon: Leaf, label: "My Farms", path: "/farms" },
  { icon: Microscope, label: "Scan My Crop", path: "/scan" },
  { icon: Radar, label: "AI Advisor", path: "/advisor" },
  { icon: Cloud, label: "Market Prices", path: "/market" },
  { icon: Boxes, label: "Products", path: "/products" },
  { icon: BookOpen, label: "Research", path: "/research" },
  { icon: ScrollText, label: "Reports", path: "/reports" },
  { icon: Newspaper, label: "Advisory", path: "/advisory" },
  { icon: User, label: "My Profile", path: "/profile" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: notifs } = trpc.notifications.list.useQuery(undefined, { refetchInterval: 30000 });
  const unread = (notifs ?? []).filter((n) => !n.read).length;

  // Role-based gating: each role only sees its allowed features.
  // farmer → dashboard, farms, scan, advisor, market, products, advisory
  // student → dashboard, advisor, research, reports, advisory, products
  // admin → everything incl. admin panel
  const role = user?.role ?? "user";
  const navItems = NAV.filter(({ path }) => {
    if (role === "admin") return true;
    if (role === "farmer") return !["/research", "/reports"].includes(path);
    if (role === "student") return !["/farms", "/scan", "/market"].includes(path);
    return true;
  });

  // Admins open the dedicated admin backoffice (a separate surface at /admin).
  const adminHref = "/admin";

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border/70 bg-clay transition-all duration-300 md:flex shadow-soft-md",
          collapsed ? "w-[74px]" : "w-64",
        )}
      >
        <div className="flex h-16 items-center gap-2.5 px-3">
          <img src={LOGO} alt="KrishAI Hub" className="h-10 w-10 shrink-0 " />
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-display text-sm font-bold tracking-wide text-ink">KrishAI Hub</div>
              <div className="font-ui truncate text-[10px] uppercase tracking-[0.2em] text-accent/80">Agriculture Intelligence</div>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {navItems.map(({ icon: Icon, label, path }) => {
            const active = path === "/" ? location === "/" : location.startsWith(path);
            return (
              <Link key={path} href={path}>
                <div
                  className={cn(
                    "neu-button flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm",
                    active ? "shadow-soft-sm surface-sage-deep" : "opacity-75",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <Icon className={cn("h-4.5 w-4.5 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                  {!collapsed && (
                    <span className={cn("font-ui", active ? "font-semibold text-ink" : "text-foreground")}>{label}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/60 p-2 space-y-1">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="neu-button flex w-full items-center justify-center rounded-2xl py-2 text-muted-foreground"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="glass fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2 md:hidden">
        <div className="flex items-center gap-2">
          <img src={LOGO} alt="KrishAI Hub" className="h-8 w-8" />
          <span className="font-display text-sm font-bold text-ink">KrishAI Hub</span>
        </div>
        <div className="flex items-center gap-2">
          <NotifBell unread={unread} />
          <UserMenu />
          <button onClick={() => setMobileOpen((o) => !o)} className="neu-button rounded-xl p-2 text-foreground" aria-label="Menu">
            {mobileOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="glass fixed inset-0 z-30 pt-14 md:hidden">
          <nav className="space-y-1 p-3">
            {navItems.map(({ icon: Icon, label, path }) => (
              <Link key={path} href={path} onClick={() => setMobileOpen(false)}>
                <div className={cn("neu-button flex items-center gap-3 rounded-2xl px-3 py-3", location === path ? "shadow-soft-sm" : "")}>
                  <Icon className="h-4.5 w-4.5 text-primary" />
                  <span className="font-ui text-sm text-foreground">{label}</span>
                </div>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main */}
      <main className="relative flex-1 pb-16 pt-16 md:pt-4">
        <div className={cn("mx-auto w-full max-w-[1400px] px-4 md:px-6", collapsed ? "md:pl-20" : "md:pl-72", collapsed ? "" : "")} style={collapsed ? { paddingLeft: "inherit" } : undefined}>
          <TopBar unread={unread} user={user} />
          {children}
        </div>
      </main>
    </div>
  );
}

function TopBar({ unread, user }: { unread: number; user: ReturnType<typeof useAuth>["user"] }) {
  return (
    <div className="mb-6 hidden items-center justify-between gap-3 md:flex">
      <div>
        <h2 className="font-display text-lg font-semibold tracking-wide text-ink">KrishAI Hub</h2>
        <p className="font-ui text-xs text-muted-foreground">Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</p>
      </div>
      <div className="flex items-center gap-3">
        <NotifBell unread={unread} />
        <UserMenu />
      </div>
    </div>
  );
}

function NotifBell({ unread }: { unread: number }) {
  return (
    <Link href="/notifications">
      <button className="neu-button relative rounded-2xl p-2.5" aria-label="Notifications">
        <Bell className="h-4.5 w-4.5 text-primary" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full surface-peach px-1 font-display text-[9px] font-bold text-accent-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </Link>
  );
}

function UserMenu() {
  const { user } = useAuth();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="neu-button flex items-center gap-2 rounded-2xl px-3 py-2" aria-label="User menu">
          <span className="flex h-6 w-6 items-center justify-center rounded-full surface-sage-deep text-[10px] font-bold text-primary">
            {(user?.name ?? "?").slice(0, 1).toUpperCase()}
          </span>
          <span className="font-ui hidden max-w-24 truncate text-xs sm:inline">{user?.name ?? "Account"}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass border-border/60">
        <DropdownMenuLabel className="font-display text-xs">KrishAI Hub</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem className="flex items-center gap-2 text-xs">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{user?.name ?? "User"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className={cn(
            "surface-sage text-primary font-display text-[9px] tracking-widest",
            user?.role === "admin" && "surface-peach text-peach",
          )}>{(user?.role ?? "user").toUpperCase()}</Badge>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/50" />
        <LogoutButton />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { NAV, LOGO };
