import AppLayout from "@/components/AppLayout";
import { FreshnessBadge, MotionPage, NeumorphicCard } from "@/components/Neumorphic";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { CROPS } from "@shared/crops";
import { Loader2, Newspaper, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { Streamdown } from "streamdown";

export default function Advisory() {
  const today = trpc.dashboard.todayRecommendation.useQuery();
  const [query, setQuery] = useState("");
  const [searchQ, setSearchQ] = useState("water management");
  const knowledge = trpc.research.knowledgeSearch.useQuery({ query: searchQ }, { enabled: Boolean(searchQ.trim()) });

  return (
    <AppLayout>
      <MotionPage>
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-ink">Daily Advisory</h1>
          <p className="font-ui text-xs text-muted-foreground">AI-synthesized guidance for today plus a searchable agricultural knowledge base.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <NeumorphicCard className="p-6" delay={0.05}>
            <div className="mb-4 flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-primary" />
              <h3 className="font-display text-sm font-semibold tracking-widest text-primary">WHAT SHOULD I DO TODAY?</h3>
            </div>
            {today.isLoading ? (
              <div className="py-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-accent" /></div>
            ) : (
              <div className="space-y-4">
                <p className="font-ui text-sm leading-relaxed">{today.data?.message ?? "Complete your profile location to receive personalized daily advisory."}</p>
                <div className="flex items-center gap-2">
                  <span className="font-ui text-[10px] uppercase tracking-widest text-muted-foreground">Response type</span>
                  <FreshnessBadge value="INFERRED" />
                  {today.data?.personalized ? <span className="font-ui text-[10px] text-primary">Personalized to your region</span> : <span className="font-ui text-[10px] text-muted-foreground">General advisory — add your location</span>}
                </div>
              </div>
            )}
          </NeumorphicCard>

          <NeumorphicCard className="p-6" delay={0.1}>
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              <h3 className="font-display text-sm font-semibold tracking-widest text-primary">KNOWLEDGE BASE</h3>
            </div>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {["water management", "soil health", "pest control", "irrigation", "fertilizer"].map((t) => (
                <button key={t} className="neu-button rounded-full px-3 py-1 font-ui text-[11px] text-primary" onClick={() => setSearchQ(t)}>{t}</button>
              ))}
            </div>
            <div className="mb-4 flex gap-2">
              <Input className="neu-pressed flex-1 font-ui" placeholder="Search the knowledge base…" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && query.trim() && setSearchQ(query.trim())} />
              <button className="neu-button btn-vivid-teal rounded-2xl px-3.5 font-ui text-xs text-white" onClick={() => query.trim() && setSearchQ(query.trim())}>
                <Search className="h-3.5 w-3.5" />
              </button>
            </div>
            {knowledge.isLoading ? (
              <div className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-accent" /></div>
            ) : knowledge.data?.length ? (
              <div className="space-y-2.5">
                {knowledge.data.map((d: any, i: number) => (
                  <div key={d.id ?? i} className="neu-pressed rounded-2xl p-4">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <h4 className="font-ui text-sm font-semibold text-ink">{d.title}</h4>
                      {d.source ? <span className="font-ui shrink-0 rounded-full border surface-sage px-2 py-0.5 text-[9px] text-primary">{d.source}</span> : null}
                    </div>
                    <p className="font-ui text-xs leading-relaxed text-muted-foreground">{d.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-ui py-6 text-center text-xs text-muted-foreground">No knowledge entries match.</p>
            )}
          </NeumorphicCard>
        </div>
      </MotionPage>
    </AppLayout>
  );
}
