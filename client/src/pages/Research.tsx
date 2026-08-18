import AppLayout from "@/components/AppLayout";
import { MotionPage, NeumorphicCard } from "@/components/Neumorphic";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ExternalLink, Loader2, BookOpen, BookmarkPlus, FlaskConical, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

type OpenAlexPaper = { title: string; abstract?: string; authors: string[]; year?: number; url?: string };

async function searchOpenAlex(q: string): Promise<OpenAlexPaper[]> {
  const res = await fetch(`https://api.openalex.org/works?search=${encodeURIComponent(q)}&per_page=20&mailto=krishai@example.com`);
  if (!res.ok) throw new Error("OpenAlex search unavailable");
  const data = await res.json();
  return (data.results ?? []).map((w: any) => ({
    title: w.title,
    abstract: w.abstract && typeof w.abstract_inverted_index === "object" ? reconstructAbstract(w) : null,
    authors: (w.authorships ?? []).slice(0, 5).map((a: any) => a.author?.display_name ?? "").filter(Boolean),
    year: w.publication_year ?? null,
    url: w.primary_location?.landing_page_url ?? w.doi ?? null,
  }));
}

function reconstructAbstract(w: any): string {
  try {
    const idx = w.abstract_inverted_index;
    const arr: [number, string][] = [];
    for (const [word, positions] of Object.entries(idx)) {
      for (const p of positions as number[]) arr.push([p, word]);
    }
    return arr.sort((a, b) => a[0] - b[0]).map(([, word]) => word).join(" ");
  } catch {
    return "";
  }
}

export default function Research() {
  const [query, setQuery] = useState("sustainable rice intensification");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [oxResults, setOxResults] = useState<OpenAlexPaper[]>([]);
  const [oxLoading, setOxLoading] = useState(false);
  const [oxQueried, setOxQueried] = useState(false);
  const papers = trpc.research.papers.useQuery();
  const utils = trpc.useUtils();
  const savePaper = trpc.research.save.useMutation({
    onSuccess: () => { utils.research.papers.invalidate(); toast.success("Paper saved to your library"); },
    onError: (e) => toast.error(e.message),
  });
  const removePaper = trpc.research.remove.useMutation({
    onSuccess: () => { utils.research.papers.invalidate(); toast.success("Removed from library"); },
  });
  const summarize = trpc.research.summarize.useMutation();
  const [activeSum, setActiveSum] = useState<{ title: string; abstract?: string } | null>(null);

  useEffect(() => {
    if (query.trim()) {
      setOxLoading(true);
      setOxQueried(false);
      const t = setTimeout(() => {
        searchOpenAlex(query.trim())
          .then((r) => setOxResults(r))
          .catch(() => setOxResults([]))
          .finally(() => { setOxLoading(false); setOxQueried(true); });
      }, 350);
      return () => clearTimeout(t);
    }
  }, [query]);

  useEffect(() => {
    if (activeSum && abstractReady && !summarize.data && !summarize.isPending) {
      summarize.mutate({ title: activeSum.title, abstract: activeSum.abstract });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSum?.title]);

  const abstractReady = Boolean(activeSum);

  return (
    <AppLayout>
      <MotionPage>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-vivid-purple">Research Portal</h1>
            <p className="font-ui text-xs text-muted-foreground">Open academic paper search (OpenAlex), AI summarization, and your personal citation library.</p>
          </div>
          <Button className="neu-button btn-vivid-purple font-ui text-xs text-white" onClick={() => setUploadOpen(true)}>
            <Upload className="h-3.5 w-3.5" /> Add Paper
          </Button>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <NeumorphicCard className="p-5 xl:col-span-2" delay={0.05}>
            <h3 className="font-display mb-3 text-sm font-semibold tracking-widest text-primary">OPEN ACADEMIC SEARCH</h3>
            <Input className="neu-pressed mb-4 w-full font-ui" placeholder="Search papers (e.g. soil health, precision agriculture)…" value={query} onChange={(e) => setQuery(e.target.value)} />
            {oxLoading ? (
              <div className="py-12 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-accent" /></div>
            ) : oxResults.length ? (
              <div className="space-y-3">
                {oxResults.map((p, i) => (
                  <div key={i} className="neu-pressed rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-ui text-sm font-semibold leading-snug text-ink">{p.title}</h4>
                        <p className="font-ui mt-1 line-clamp-2 text-xs text-muted-foreground">{p.abstract ? p.abstract.slice(0, 220) + (p.abstract.length > 220 ? "…" : "") : "No abstract available."}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {p.authors.slice(0, 4).map((a) => (
                            <span key={a} className="font-ui rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">{a}</span>
                          ))}
                          {p.year ? <span className="font-display text-[10px] text-muted-foreground">{p.year}</span> : null}
                          {p.url ? (
                            <a href={p.url} target="_blank" rel="noreferrer" className="font-ui flex items-center gap-1 text-[10px] text-primary hover:underline">
                              <ExternalLink className="h-2.5 w-2.5" /> Source
                            </a>
                          ) : null}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="neu-button shrink-0 surface-sage-deep font-ui text-[10px] text-primary" onClick={() => savePaper.mutate({ title: p.title, url: p.url ?? undefined, note: p.abstract?.slice(0, 500) })}>
                        <BookmarkPlus className="h-3 w-3" /> Save
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : oxQueried ? (
              <p className="font-ui py-8 text-center text-xs text-muted-foreground">No papers found for this query.</p>
            ) : (
              <p className="font-ui py-8 text-center text-xs text-muted-foreground">Type to search the open academic index.</p>
            )}
          </NeumorphicCard>

          <NeumorphicCard className="p-5" delay={0.1}>
            <h3 className="font-display mb-3 text-sm font-semibold tracking-widest text-primary">MY LIBRARY</h3>
            {papers.data?.length ? (
              <div className="space-y-3">
                {papers.data.map((p: any) => (
                  <div key={p.id} className="neu-pressed rounded-2xl p-3.5">
                    <h4 className="font-ui line-clamp-2 text-xs font-semibold text-ink">{p.title}</h4>
                    <div className="mt-2 flex gap-1.5">
                      <Button size="sm" variant="outline" className="neu-button h-7 surface-sage-deep px-2 font-ui text-[10px] text-primary" onClick={() => setActiveSum({ title: p.title })}>
                        <FlaskConical className="h-3 w-3" /> AI Summary
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 shrink-0 p-0 text-muted-foreground" onClick={() => removePaper.mutate({ id: p.id })}>
                        <BookOpen className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-ui flex flex-col items-center gap-2 py-8 text-center text-xs text-muted-foreground">
                <BookOpen className="h-5 w-5" /> Your saved papers will appear here.
              </p>
            )}
          </NeumorphicCard>
        </div>

        <SummarizeDialog
          paper={activeSum}
          abstractReady={abstractReady}
          onClose={() => setActiveSum(null)}
        />
        <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />
      </MotionPage>
    </AppLayout>
  );
}

function SummarizeDialog({ paper, abstractReady, onClose }: { paper: { title: string; abstract?: string } | null; abstractReady: boolean; onClose: () => void }) {
  const summarize = trpc.research.summarize.useMutation();
  useEffect(() => {
    if (paper && abstractReady && !summarize.data && !summarize.isPending) {
      summarize.mutate({ title: paper.title, abstract: paper.abstract });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paper?.title]);

  return (
    <Dialog open={paper !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass border-border/60 max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-sm tracking-wide text-ink">AI Summary — {paper?.title}</DialogTitle>
        </DialogHeader>
        {summarize.isPending ? (
          <div className="py-10 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-accent" /></div>
        ) : summarize.data ? (
          <div className="font-ui max-h-[55vh] space-y-3 overflow-y-auto text-sm leading-relaxed">
            <Streamdown>{summarize.data as string}</Streamdown>
          </div>
        ) : (
          <p className="font-ui text-xs text-muted-foreground">No summary available.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function UploadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const savePaper = trpc.research.save.useMutation({
    onSuccess: () => { onClose(); setTitle(""); setUrl(""); setNote(""); toast.success("Paper added to your library"); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass border-border/60 max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-sm tracking-wide text-ink">Add a Paper</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input className="neu-pressed font-ui" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input className="neu-pressed font-ui" placeholder="URL / DOI (optional)" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Textarea className="neu-pressed font-ui" rows={5} placeholder="Abstract or key notes (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <Button className="w-full neu-button btn-vivid-purple font-ui text-white" onClick={() => savePaper.mutate({ title: title.trim(), url: url.trim() || undefined, note: note.trim() || undefined })} disabled={!title.trim() || savePaper.isPending}>
            {savePaper.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Save to Library
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
