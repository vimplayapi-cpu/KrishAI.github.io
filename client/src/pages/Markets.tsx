import AppLayout from "@/components/AppLayout";
import { FreshnessBadge, MotionPage, NeumorphicCard } from "@/components/Neumorphic";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { CROPS } from "@shared/crops";
import { Loader2, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

export default function Markets() {
  const [query, setQuery] = useState("");
  const market = trpc.market.prices.useQuery({ forceLive: false });

  const rows = useMemo(() => {
    const data = market.data?.rows ?? [];
    const q = query.trim().toLowerCase();
    return q ? data.filter((r) => (r.commodity + r.variety + r.market + r.state + r.district).toLowerCase().includes(q)) : data;
  }, [market.data, query]);

  return (
    <AppLayout>
      <MotionPage>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Mandi Market Prices</h1>
            <p className="font-ui text-xs text-muted-foreground">Live &amp; cached mandi arrivals from the open agri-market feed. Source labels: LIVE / CACHED / INFERRED.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-ui surface-sage text-primary">
              {market.data?.freshness ?? "—"}
            </Badge>
            <button className="neu-button btn-vivid-gold flex h-9 items-center gap-2 rounded-2xl px-4 font-ui text-xs text-white" onClick={() => market.refetch()}>
              <RefreshCw className={`h-3.5 w-3.5 ${market.isFetching ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>

        <NeumorphicCard className="p-5" delay={0.05}>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Input className="neu-pressed w-full max-w-sm font-ui" placeholder="Search crop, variety, market, district…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="flex flex-wrap gap-1.5">
              {["", "Wheat", "Rice", "Soybean", "Cotton"].map((c) => (
                <button key={c || "all"} className={`neu-button rounded-full px-3 py-1 font-ui text-[11px] ${!c && !query ? "shadow-soft-sm" : "text-primary"}`} onClick={() => setQuery(c)}>{c || "All"}</button>
              ))}
            </div>
          </div>

          {market.isLoading ? (
            <div className="flex flex-col items-center gap-3 py-14">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <span className="font-ui text-xs text-muted-foreground">Fetching mandi prices…</span>
            </div>
          ) : rows.length ? (
            <div className="overflow-x-auto rounded-2xl border border-border/50">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="font-display text-[10px] uppercase tracking-widest text-primary">Commodity</TableHead>
                    <TableHead className="font-display text-[10px] uppercase tracking-widest text-primary">Variety</TableHead>
                    <TableHead className="font-display text-[10px] uppercase tracking-widest text-primary">Market</TableHead>
                    <TableHead className="font-display text-[10px] uppercase tracking-widest text-primary">District / State</TableHead>
                    <TableHead className="font-display text-right text-[10px] uppercase tracking-widest text-primary">Modal ₹/qt</TableHead>
                    <TableHead className="font-display text-right text-[10px] uppercase tracking-widest text-primary">Min ₹/qt</TableHead>
                    <TableHead className="font-display text-right text-[10px] uppercase tracking-widest text-primary">Max ₹/qt</TableHead>
                    <TableHead className="font-display text-[10px] uppercase tracking-widest text-primary">Arrival</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 200).map((r: any, i) => (
                    <TableRow key={i} className="border-border/30 hover:bg-foreground/5">
                      <TableCell className="font-ui text-sm font-semibold text-ink">{r.commodity}</TableCell>
                      <TableCell className="font-ui text-xs text-muted-foreground">{r.variety}</TableCell>
                      <TableCell className="font-ui text-xs text-muted-foreground">{r.market}</TableCell>
                      <TableCell className="font-ui text-xs text-muted-foreground">{r.district}, {r.state}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-display text-sm font-bold text-primary">₹{r.modalPrice?.toLocaleString?.() ?? r.modalPrice}</span>
                      </TableCell>
                      <TableCell className="text-right font-ui text-xs text-muted-foreground">₹{r.minPrice}</TableCell>
                      <TableCell className="text-right font-ui text-xs text-muted-foreground">₹{r.maxPrice}</TableCell>
                      <TableCell className="font-ui text-[11px] text-muted-foreground">{r.arrivalDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="font-ui py-10 text-center text-xs text-muted-foreground">{query ? "No matches — try a different search." : "No price data available right now."}</p>
          )}
          <p className="font-ui mt-4 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
            {market.data?.freshness === "CACHED" ? <RefreshCw className="mt-0.5 h-3 w-3 shrink-0" /> : <TrendingUp className="mt-0.5 h-3 w-3 shrink-0" />}
            Data shown is {market.data?.freshness?.toLowerCase() ?? "unavailable"}. Live feed may take a few seconds; stale values are labeled automatically.
          </p>
        </NeumorphicCard>
      </MotionPage>
    </AppLayout>
  );
}
