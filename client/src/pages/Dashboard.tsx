import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout, { LOGO } from "@/components/AppLayout";
import OnboardingWizard from "@/components/OnboardingWizard";
import { FreshnessBadge, MotionPage, NeumorphicCard, StatChip } from "@/components/Neumorphic";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Cloud,
  Droplets,
  Leaf,
  Sun,
  Thermometer,
  Wind,
  Wheat,
} from "lucide-react";
import { Link } from "wouter";


const STAGE_LABELS: Record<string, string> = {
  land_preparation: "Land Preparation",
  sowing: "Sowing",
  germination: "Germination",
  vegetative: "Vegetative",
  flowering: "Flowering",
  fruiting: "Fruiting",
  maturity: "Maturity",
  harvest: "Harvest",
  post_harvest: "Post-Harvest",
};

export default function Dashboard() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const profile = trpc.profile.get.useQuery();

  if (profile.data && !profile.data.onboardingComplete) {
    return <OnboardingWizard onDone={() => utils.profile.get.invalidate()} />;
  }

  const widgets = trpc.dashboard.widgets.useQuery(undefined, { refetchInterval: 5 * 60_000 });
  const d = widgets.data;

  return (
    <AppLayout>
      <MotionPage>
        {/* Hero strip */}
        <div className="neu-raised relative mb-6 flex items-center gap-5 overflow-hidden rounded-3xl p-6 md:p-8">
          <div className="neu-pressed flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sage/30 to-clay p-2 md:h-36 md:w-36">
            <img src={LOGO} alt="KrishAI Hub" className="aspect-square w-3/4 animate-float rounded-full object-cover drop-shadow-md md:w-4/5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink md:text-4xl">
              {user?.role === "admin" ? "Command Deck" : "Your Field, Decoded"}
            </h1>
            <p className="font-ui mt-2 max-w-xl text-sm text-muted-foreground">
              Real-time weather intelligence, live mandi prices and AI vision crop diagnosis — fused into one coherent hub.
            </p>
          </div>
          <div className="surface-sage absolute -right-8 -top-8 h-32 w-32 rotate-12 rounded-full opacity-60 blur-xl" />
          <div className="surface-lavender absolute -bottom-10 right-24 h-28 w-28 rounded-full opacity-50 blur-xl" />
        </div>

        {widgets.isLoading ? <DashboardSkeleton /> : null}

        <div className="grid gap-5 lg:grid-cols-3">
          {/* What should I do today */}
          <NeumorphicCard className="shadow-soft-sm col-span-1 p-6 lg:col-span-2" delay={0.05}>
            <div className="mb-3 flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-peach" />
              <h3 className="font-display text-sm font-semibold tracking-widest text-peach">WHAT SHOULD I DO TODAY?</h3>
            </div>
            {d?.today?.message ? (
              <p className="font-ui text-sm leading-relaxed text-foreground/90">{d.today.message}</p>
            ) : (
              <p className="font-ui text-sm text-muted-foreground">Loading today's advisory…</p>
            )}
            {d?.today?.items && d.today.items.length > 0 && (
              <div className="mt-4 space-y-2">
                {d.today.items.map((item: any, i: number) => (
                  <div key={i} className={`neu-pressed rounded-2xl p-3 text-xs ${item.priority === 'high' ? 'border-l-4 border-l-peach' : ''}`}>
                    <span className="font-display font-bold uppercase text-[9px] tracking-widest text-muted-foreground">{item.kind.replace('_', ' ')}</span>
                    <p className="font-ui mt-1 text-ink/90"><span className="font-semibold">{item.title}:</span> {item.detail}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Link href="/advisor">
                <Button size="sm" className="neu-button font-ui text-xs">Ask the AI Advisor</Button>
              </Link>
              {!d?.profile?.state ? (
                <span className="font-ui text-xs text-muted-foreground">Tip: complete your profile in onboarding for personalized advice.</span>
              ) : null}
            </div>
          </NeumorphicCard>

          {/* Weather */}
          <NeumorphicCard className="p-6" delay={0.1}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold tracking-widest text-primary">WEATHER</h3>
              {d?.weather?.freshness ? <FreshnessBadge value={d.weather.freshness} /> : null}
            </div>
            {d?.weather ? (
              <>
                <div className="flex items-end gap-3">
                  <Sun className="h-9 w-9 text-peach" />
                  <div>
                    <div className="font-display text-4xl font-bold text-ink">{Math.round(d.weather.current.temperature)}°</div>
                    <div className="font-ui text-xs capitalize text-muted-foreground">{d.weather.current.description}</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="neu-pressed rounded-2xl p-3 text-center">
                    <Droplets className="mx-auto mb-1 h-4 w-4 text-accent" />
                    <div className="font-display text-sm text-ink">{d.weather.current.humidity}%</div>
                    <div className="font-ui text-[9px] uppercase tracking-wider text-muted-foreground">Humidity</div>
                  </div>
                  <div className="neu-pressed rounded-2xl p-3 text-center">
                    <Cloud className="mx-auto mb-1 h-4 w-4 text-accent" />
                    <div className="font-display text-sm text-ink">{d.weather.current.rainProbability}%</div>
                    <div className="font-ui text-[9px] uppercase tracking-wider text-muted-foreground">Rain</div>
                  </div>
                  <div className="neu-pressed rounded-2xl p-3 text-center">
                    <Wind className="mx-auto mb-1 h-4 w-4 text-accent" />
                    <div className="font-display text-sm text-ink">{d.weather.current.windSpeed}</div>
                    <div className="font-ui text-[9px] uppercase tracking-wider text-muted-foreground">km/h Wind</div>
                  </div>
                </div>
                <div className="mt-3 neu-pressed rounded-2xl p-3">
                  <p className="font-ui text-xs text-muted-foreground">
                    <Thermometer className="mr-1 inline h-3 w-3 text-text-success" />
                    {d.weather.agri.irrigationAdvice}
                  </p>
                </div>
                {d.weather.agri.humidityDiseaseRisk === "high" ? (
                  <div className="mt-3 flex items-center gap-2 rounded-2xl border surface-peach surface-peach p-3">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
                    <span className="font-ui text-xs text-peach">High humidity — increased fungal disease risk. Consider protective care.</span>
                  </div>
                ) : null}

              </>
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-12 w-32 neu-pressed" />
                <Skeleton className="h-20 w-full neu-pressed" />
              </div>
            )}
          </NeumorphicCard>

          {/* Active crops */}
          <NeumorphicCard className="p-6" delay={0.15}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold tracking-widest text-primary">ACTIVE CROPS</h3>
              <Wheat className="h-4 w-4 text-text-success" />
            </div>
            <div className="space-y-3">
              {d?.crops?.length ? (
                d.crops.map(({ farmName, crop }) => (
                  <div key={crop.id} className="neu-pressed flex items-center justify-between rounded-2xl px-4 py-3">
                    <div>
                      <div className="font-ui text-sm font-semibold text-ink">{crop.name}</div>
                      <div className="font-ui text-[11px] text-muted-foreground">{farmName}</div>
                    </div>
                    <span className={cn("font-display rounded-full px-2.5 py-1 text-[9px] font-semibold tracking-widest",
                      crop.stage === "harvest" ? "surface-peach text-peach" : "surface-sage text-primary")}>
                      {STAGE_LABELS[crop.stage ?? "land_preparation"] ?? crop.stage}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-2xl py-6 text-center">
                  <Leaf className="h-6 w-6 text-muted-foreground" />
                  <p className="font-ui text-xs text-muted-foreground">No crops tracked yet. Add a farm and start tracking its lifecycle.</p>
                  <Link href="/farms">
                    <Button size="sm" className="neu-button btn-vivid-green font-ui text-xs text-white">+ Add Farm & Crop</Button>
                  </Link>
                </div>
              )}
            </div>
          </NeumorphicCard>

          {/* Market snapshot */}
          <NeumorphicCard className="p-6" delay={0.2}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold tracking-widest text-peach">MANDI PRICES</h3>
              {d?.weather ? null : null}
            </div>
            <div className="space-y-2">
              {d?.marketPreview && typeof d.marketPreview === "object" && "rows" in d.marketPreview && Array.isArray((d.marketPreview as any).rows) ? (
                ((d.marketPreview as any).rows as any[]).slice(0, 5).map((row: any) => (
                  <div key={`${row.commodity}-${row.market}`} className="flex items-center justify-between rounded-xl border border-border/40 px-3 py-2">
                    <div className="font-ui text-xs text-foreground">
                      <span className="font-semibold">{row.commodity}</span>
                      <span className="text-muted-foreground"> · {row.market}</span>
                    </div>
                    <span className="font-display text-xs text-peach">₹{row.modalPrice}/q</span>
                  </div>
                ))
              ) : (
                <p className="font-ui text-xs text-muted-foreground">Live mandi feed loads on the Markets page.</p>
              )}
            </div>
            <div className="mt-3 text-right">
              <Link href="/market">
                <span className="font-ui text-xs text-accent hover:underline">View all markets →</span>
              </Link>
            </div>
          </NeumorphicCard>

          {/* Quick actions */}
          <NeumorphicCard className="p-6" delay={0.25}>
            <h3 className="font-display mb-4 text-sm font-semibold tracking-widest text-primary">QUICK ACTIONS</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/scan">
                <button className="neu-button flex h-full w-full flex-col items-center gap-2 rounded-2xl p-4 text-center">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                  <span className="font-ui text-[11px] font-semibold leading-tight text-foreground">Scan My Crop</span>
                </button>
              </Link>
              <Link href="/advisor">
                <button className="neu-button flex h-full w-full flex-col items-center gap-2 rounded-2xl p-4 text-center">
                  <ArrowRight className="h-5 w-5 text-primary" />
                  <span className="font-ui text-[11px] font-semibold leading-tight text-foreground">AI Advisor</span>
                </button>
              </Link>
              <Link href="/market">
                <button className="neu-button flex h-full w-full flex-col items-center gap-2 rounded-2xl p-4 text-center">
                  <Thermometer className="h-5 w-5 text-peach" />
                  <span className="font-ui text-[11px] font-semibold leading-tight text-foreground">Mandi Prices</span>
                </button>
              </Link>
              <Link href="/reports">
                <button className="neu-button flex h-full w-full flex-col items-center gap-2 rounded-2xl p-4 text-center">
                  <Leaf className="h-5 w-5 text-primary" />
                  <span className="font-ui text-[11px] font-semibold leading-tight text-foreground">AI Reports</span>
                </button>
              </Link>
            </div>
          </NeumorphicCard>
        </div>

        {d?.today?.personalized === false ? (
          <div className="mt-5 neu-pressed rounded-2xl border border-accent/25 p-4">
            <p className="font-ui text-xs text-muted-foreground">
              <Cloud className="mr-1 inline h-3.5 w-3.5 text-accent" />
              Advice is general because your location isn't set yet — complete onboarding to receive hyper-local recommendations for your district.
            </p>
          </div>
        ) : null}
      </MotionPage>
    </AppLayout>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mb-5 grid gap-5 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="neu h-44 rounded-3xl p-6">
          <Skeleton className="h-4 w-32 neu-pressed" />
          <Skeleton className="mt-3 h-20 w-full neu-pressed" />
        </div>
      ))}
    </div>
  );
}
