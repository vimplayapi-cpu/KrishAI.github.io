import AppLayout from "@/components/AppLayout";
import { MotionPage, NeumorphicCard } from "@/components/Neumorphic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Bot, Download, FileText, Loader2, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

const TYPES = [
  { id: "crop", label: "Crop Report", desc: "Stage, care plan, and yield outlook" },
  { id: "disease", label: "Disease Scan", desc: "Diagnosis confidence and action plan" },
  { id: "farm", label: "Farm Summary", desc: "All farms with recommendations" },
  { id: "weather", label: "Weather Outlook", desc: "7-day forecast with agri advice" },
  { id: "market", label: "Market Snapshot", desc: "Live mandi price roundup" },
  { id: "research", label: "Research Digest", desc: "Key findings from your library" },
] as const;

export default function Reports() {
  const reports = trpc.reports.list.useQuery();
  const utils = trpc.useUtils();
  const [genOpen, setGenOpen] = useState(false);
  const [genType, setGenType] = useState<(typeof TYPES)[number]["id"]>("weather");
  const [genTitle, setGenTitle] = useState("");
  const [genSubject, setGenSubject] = useState("");
  const [viewId, setViewId] = useState<number | null>(null);
  const [viewData, setViewData] = useState<any>(null);

  const getReport = trpc.reports.get.useQuery(
    { id: viewId ?? 0 },
    { enabled: viewId !== null },
  );
  useEffect(() => {
    if (viewId !== null && getReport.data) setViewData(getReport.data);
  }, [getReport.data, viewId]);
  const generate = trpc.reports.generate.useMutation({
    onSuccess: (r: any) => {
      utils.reports.list.invalidate();
      setGenOpen(false);
      setGenTitle(""); setGenSubject("");
      toast.success("Report generated");
      setViewId(r?.id ?? null);
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = trpc.reports.remove.useMutation({
    onSuccess: () => { utils.reports.list.invalidate(); toast.success("Report deleted"); },
  });

  const downloadJson = (r: any) => {
    const blob = new Blob([JSON.stringify({ id: r.id, type: r.type, title: r.title, aiGenerated: r.aiGenerated, createdAt: r.createdAt, body: r.body }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `krishai-report-${r.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <MotionPage>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-vivid-blue">Reports</h1>
            <p className="font-ui text-xs text-muted-foreground">AI-generated reports flagged with an AI-generated disclosure badge. Export any report as JSON.</p>
          </div>
          <Button className="neu-button btn-vivid-blue font-ui text-xs text-white" onClick={() => setGenOpen(true)}>
            <Sparkles className="h-3.5 w-3.5" /> Generate Report
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(reports.data ?? []).map((r: any, i: number) => (
            <div key={r.id} className="neu-pressed group rounded-2xl p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-accent" />
                  <h3 className="font-ui text-sm font-semibold text-ink">{r.title}</h3>
                </div>
                {r.aiGenerated ? (
                  <Badge variant="outline" className="font-ui shrink-0 surface-peach text-[9px] text-peach">AI-GENERATED</Badge>
                ) : null}
              </div>
              <p className="font-ui line-clamp-3 text-xs leading-relaxed text-muted-foreground">{r.body}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-display text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="neu-button h-7 surface-sage-deep px-2 font-ui text-[10px] text-primary" onClick={() => setViewId(r.id)}>View</Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 shrink-0 p-0 text-muted-foreground" onClick={() => downloadJson(r)}><Download className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 shrink-0 p-0 text-muted-foreground" onClick={() => remove.mutate({ id: r.id })}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {!reports.data?.length && !reports.isLoading && (
          <NeumorphicCard className="flex flex-col items-center gap-2 py-14" delay={0.05}>
            <FileText className="h-8 w-8 text-muted-foreground" />
            <p className="font-ui text-xs text-muted-foreground">No reports yet. Generate your first crop, weather, or market report.</p>
          </NeumorphicCard>
        )}

        {/* generate dialog */}
        <Dialog open={genOpen} onOpenChange={(o) => !o && setGenOpen(false)}>
          <DialogContent className="glass border-border/60 max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display text-sm tracking-wide text-ink">Generate Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-1.5">
                {TYPES.map((t) => (
                  <button key={t.id} className={`neu-button rounded-xl p-2.5 text-left ${genType === t.id ? "shadow-soft-sm" : "text-muted-foreground"}`} onClick={() => setGenType(t.id)}>
                    <span className="font-ui block text-[11px] font-semibold text-primary">{t.label}</span>
                    <span className="font-ui block text-[9px] leading-tight opacity-70">{t.desc}</span>
                  </button>
                ))}
              </div>
              <Input className="neu-pressed font-ui" placeholder="Report title" value={genTitle} onChange={(e) => setGenTitle(e.target.value)} />
              <Textarea className="neu-pressed font-ui" rows={3} placeholder="Optional subject detail (crop, farm, question)…" value={genSubject} onChange={(e) => setGenSubject(e.target.value)} />
              <Button className="w-full neu-button btn-vivid-blue font-ui text-white" disabled={!genTitle.trim() || generate.isPending} onClick={() => generate.mutate({ type: genType, title: genTitle.trim(), subject: genSubject.trim() || undefined })}>
                {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />} Generate with AI
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* view dialog */}
        <Dialog open={viewId !== null} onOpenChange={(o) => !o && setViewId(null)}>
          <DialogContent className="glass border-border/60 max-w-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                <DialogTitle className="font-display text-sm tracking-wide text-ink">{viewData?.title}</DialogTitle>
                {viewData?.aiGenerated ? (
                  <Badge variant="outline" className="font-ui surface-peach text-[9px] text-peach">AI-GENERATED</Badge>
                ) : null}
              </div>
            </DialogHeader>
            <div className="font-ui max-h-[55vh] space-y-3 overflow-y-auto text-sm leading-relaxed">
              <Streamdown>{(viewData?.body as string) ?? ""}</Streamdown>
            </div>
            <div className="flex justify-end gap-2 border-t border-border/50 pt-3">
              <Button size="sm" variant="outline" className="neu-button surface-sage-deep font-ui text-xs text-primary" onClick={() => downloadJson(viewData)}>
                <Download className="h-3.5 w-3.5" /> Export JSON
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </MotionPage>
    </AppLayout>
  );
}
