import AppLayout from "@/components/AppLayout";
import { MotionPage, NeumorphicCard } from "@/components/Neumorphic";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, Package } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function Products() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const products = trpc.products.search.useQuery({ query: undefined, category: undefined });

  const categories = useMemo(() => {
    const set = new Set((products.data ?? []).map((p: any) => p.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [products.data]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products.data ?? []).filter((p: any) =>
      (!category || category === "All" || p.category === category) &&
      (!q || (p.name + (p.brand ?? "") + (p.type ?? "")).toLowerCase().includes(q)),
    );
  }, [products.data, query, category]);

  useEffect(() => {}, [rows]);

  return (
    <AppLayout>
      <MotionPage>
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-vivid-blue">Products Directory</h1>
          <p className="font-ui text-xs text-muted-foreground">Curated seeds, fertilizers, equipment and bio-inputs for Indian agriculture.</p>
        </div>

        <NeumorphicCard className="p-5" delay={0.05}>
          <div className="mb-4 flex flex-wrap gap-2">
            <Input className="neu-pressed w-full max-w-sm font-ui" placeholder="Search products…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button key={c} className={`neu-button rounded-full px-3 py-1 font-ui text-[11px] ${category === c || (c === "All" && !category) ? "shadow-soft-sm" : "text-primary"}`} onClick={() => setCategory(c)}>{c}</button>
              ))}
            </div>
          </div>

          {products.isLoading ? (
            <div className="py-14 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-accent" /></div>
          ) : rows.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((p: any, i: number) => (
                <div key={p.id ?? i} className="neu-pressed rounded-2xl p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-ui text-sm font-semibold text-ink">{p.name}</h3>
                    <span className="font-display shrink-0 rounded-full surface-sage px-2 py-0.5 text-[10px] tracking-wide text-primary">{p.category ?? "—"}</span>
                  </div>
                  {p.brand ? <p className="font-ui text-xs text-primary">{p.brand}</p> : null}
                  <p className="font-ui mt-1 text-xs leading-relaxed text-muted-foreground">{p.type ?? p.description ?? "—"}</p>
                  {p.dose ? <p className="font-ui mt-2 text-[11px] text-muted-foreground"><span className="text-peach">Use:</span> {p.dose}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Package className="h-7 w-7 text-muted-foreground" />
              <p className="font-ui text-xs text-muted-foreground">No products match your search.</p>
            </div>
          )}
        </NeumorphicCard>
      </MotionPage>
    </AppLayout>
  );
}
