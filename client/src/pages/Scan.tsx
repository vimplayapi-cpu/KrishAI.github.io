import AppLayout from "@/components/AppLayout";
import { FreshnessBadge, MotionPage, NeumorphicCard } from "@/components/Neumorphic";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { CROPS as REFERENCE_CROPS } from "@shared/crops";
import { AlertTriangle, ArrowRight, Camera, CheckCircle2, Loader2, ScanEye, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

type PendingImage = { name: string; dataUrl: string; file: File };

export default function Scan() {
  const [images, setImages] = useState<PendingImage[]>([]);
  const [crop, setCrop] = useState("");
  const [view, setView] = useState<"capture" | "reports">("capture");
  const [activeId, setActiveId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 5 - images.length).filter((f) => f.type.startsWith("image/"));
    arr.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [...prev, { name: file.name, dataUrl: reader.result as string, file }]);
      };
      reader.readAsDataURL(file);
    });
    if (files.length > 5 - images.length) toast.info("Up to 5 images per scan");
  };

  return (
    <AppLayout>
      <MotionPage>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-vivid-orange">Scan My Crop</h1>
            <p className="font-ui text-xs text-muted-foreground">AI vision diagnosis with confidence scoring and full uncertainty disclosure.</p>
          </div>
          <Tabs value={view} onValueChange={(v) => setView(v as "capture" | "reports")}>
            <TabsList className="neu-pressed">
              <TabsTrigger value="capture" className="font-ui data-[state=active]:text-primary">New Scan</TabsTrigger>
              <TabsTrigger value="reports" className="font-ui data-[state=active]:text-primary">My Reports</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {view === "capture" ? (
          <CaptureView
            images={images}
            onAdd={addFiles}
            onRemove={(i: number) => setImages((p) => p.filter((_, idx) => idx !== i))}
            crop={crop}
            onCrop={setCrop}
            fileRef={fileRef}
            onAnalyzed={(result: any, id: number) => { setActiveId(id); }}
          />
        ) : (
          <ReportsView activeId={activeId} setActiveId={setActiveId} />
        )}
        <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
      </MotionPage>
    </AppLayout>
  );
}

function CaptureView({ images, onAdd, onRemove, crop, onCrop, fileRef, onAnalyzed }: {
  images: PendingImage[];
  onAdd: (files: FileList | null) => void;
  onRemove: (i: number) => void;
  crop: string;
  onCrop: (c: string) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onAnalyzed: (result: any, id: number) => void;
}) {
  const analyze = trpc.disease.analyze.useMutation({
    onSuccess: (res) => {
      onAnalyzed(res.result, res.analysis.id);
      toast.success("Diagnosis complete — report saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const runAnalysis = () => {
    if (!crop) { toast.error("Select a crop first"); return; }
    if (!images.length) { toast.error("Add at least one image"); return; }
    analyze.mutate({ crop, images: images.map((im: PendingImage) => im.dataUrl) });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      {/* left: upload */}
      <NeumorphicCard className="p-5 lg:col-span-2" delay={0.05}>
        <h3 className="font-display mb-3 text-sm font-semibold tracking-widest text-primary">1 · CAPTURE</h3>
        <div
          className="neu-pressed flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-accent/30 transition-colors hover:border-accent/60"
          onClick={() => fileRef.current?.click()}
        >
          <Camera className="h-6 w-6 text-accent" />
          <span className="font-ui text-xs text-muted-foreground">Click to capture or upload · up to 5 images</span>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((im: PendingImage, i: number) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-border/60">
              <img src={im.dataUrl} alt={im.name} className="h-full w-full object-cover" />
              <button
                className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-1 text-ink"
                onClick={() => onRemove(i)}
                aria-label="Remove image"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        <h3 className="font-display mt-6 mb-3 text-sm font-semibold tracking-widest text-primary">2 · SELECT CROP</h3>
        <Select value={crop || undefined} onValueChange={onCrop}>
          <SelectTrigger className="w-full neu-pressed font-ui"><SelectValue placeholder="Which crop is this?" /></SelectTrigger>
          <SelectContent>
            {REFERENCE_CROPS.map((c: string) => (
              <SelectItem key={c} value={c} className="font-ui">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          className="w-full mt-6 neu-button btn-vivid-orange font-ui text-white"
          size="lg"
          onClick={runAnalysis}
          disabled={analyze.isPending}
        >
          {analyze.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanEye className="h-4 w-4" />}
          {analyze.isPending ? "Analyzing with AI vision…" : "Run AI Diagnosis"}
        </Button>
        <p className="font-ui mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
          AI vision can miss or misclassify conditions. Treat this as a screening aid, not a replacement for an agronomist.
        </p>
      </NeumorphicCard>

      {/* right: result */}
      <NeumorphicCard className="p-6 lg:col-span-3" delay={0.1}>
        <h3 className="font-display mb-4 text-sm font-semibold tracking-widest text-peach">3 · AI DIAGNOSIS</h3>
        {analyze.isPending ? (
          <div className="flex flex-col items-center gap-4 py-10">
            <Loader2 className="h-10 w-10 animate-spin text-accent" />
            <Progress value={undefined} className="w-3/4 h-1.5" />
            <span className="font-ui text-xs text-muted-foreground">AI vision is examining your images…</span>
          </div>
        ) : analyze.data ? (
          <DiagnosisResult data={analyze.data.result} onReset={() => analyze.reset()} />
        ) : (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
            <ScanEye className="h-8 w-8 text-muted-foreground" />
            <p className="font-ui max-w-xs text-xs text-muted-foreground">Upload crop photos and pick the crop. The AI vision engine will return a diagnosis, a confidence score, and an uncertainty disclosure.</p>
          </div>
        )}
      </NeumorphicCard>
    </div>
  );
}

function DiagnosisResult({ data, reportId, onReset }: { data: any; reportId?: number; onReset: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-display text-lg font-semibold text-ink">{data?.issue ?? "No finding"}</h4>
          <p className="font-ui text-xs capitalize text-muted-foreground">Detected crop: {data?.detectedCrop ?? "—"}</p>
        </div>
        <FreshnessBadge value={data.freshness ?? "INFERRED"} />
      </div>
      <div className="neu-pressed rounded-2xl p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Confidence</span>
          <span className="font-display text-xl font-bold text-primary">{data?.confidence ?? 0}%</span>
        </div>
        <Progress value={data?.confidence ?? 0} className="h-2" />
      </div>
      <p className="font-ui text-sm leading-relaxed">Severity: <span className="font-semibold capitalize text-ink">{data?.severity ?? "—"}</span></p>
      {(data?.nextSteps?.length ?? 0) > 0 ? (
        <ul className="space-y-2">
          {data.nextSteps.map((r: string, i: number) => (
            <li key={i} className="neu-pressed flex items-start gap-2 rounded-xl p-3">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-success" />
              <span className="font-ui text-xs leading-relaxed">{r}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {data?.uncertaintyDisclosure ? (
        <div className="rounded-2xl border surface-peach surface-peach p-4">
          <p className="font-ui mb-1 flex items-center gap-2 text-xs font-semibold text-peach">
            <AlertTriangle className="h-3.5 w-3.5" /> Uncertainty Disclosure
          </p>
          <p className="font-ui text-xs leading-relaxed text-muted-foreground">{data.uncertaintyDisclosure}</p>
        </div>
      ) : null}
      <div className="flex gap-2">
        <Button size="sm" className="neu-button font-ui text-xs" disabled>
          <CheckCircle2 className="h-3.5 w-3.5 text-text-success" /> Auto-saved on scan
        </Button>
        <Button size="sm" variant="outline" className="neu-button surface-sage-deep font-ui text-xs text-primary" onClick={onReset}>
          <X className="h-3.5 w-3.5" /> New Scan
        </Button>
      </div>
    </div>
  );
}

function ReportsView({ activeId, setActiveId }: { activeId: number | null; setActiveId: (id: number | null) => void }) {
  const reports = trpc.disease.history.useQuery();
  return (
    <div className="space-y-4">
      <NeumorphicCard className="p-6" delay={0.05}>
        <h3 className="font-display mb-4 text-sm font-semibold tracking-widest text-primary">SAVED SCAN REPORTS</h3>
        {reports.isLoading ? (
          <div className="py-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-accent" /></div>
        ) : reports.data?.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {reports.data.map((r: any) => (
              <div
                key={r.id}
                className={`neu-pressed cursor-pointer rounded-2xl p-4 transition-colors ${activeId === r.id ? "shadow-soft-sm" : ""}`}
                onClick={() => setActiveId(r.id)}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-ui text-sm font-semibold text-ink">{r.crop ?? "Unknown crop"}</span>
                  <span className="font-display rounded-full surface-lavender px-2 py-0.5 text-[10px] font-semibold text-primary">{r.confidence ?? 0}%</span>
                </div>
                <p className="font-ui line-clamp-2 text-xs text-muted-foreground">{r.result?.issue ?? "See details"}</p>
                <p className="font-ui mt-2 text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-ui text-center text-xs text-muted-foreground">No scan reports yet. Run a scan first.</p>
        )}
      </NeumorphicCard>
      {activeId !== null && (
        <NeumorphicCard className="p-6" delay={0.1} key={activeId}>
          <ReportDetail id={activeId} />
        </NeumorphicCard>
      )}
    </div>
  );
}

function ReportDetail({ id }: { id: number }) {
  const report = trpc.disease.get.useQuery({ id });
  const saveReport = trpc.disease.saveReport.useMutation({
    onSuccess: () => toast.success("Added to AI Reports"),
  });
  if (report.isLoading) {
    return <div className="py-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-accent" /></div>;
  }
  if (!report.data) return null;
  return (
    <div className="space-y-4">
      <DiagnosisResult data={report.data.result as never} onReset={() => {}} />
      <Button size="sm" className="neu-button btn-vivid-teal font-ui text-xs text-white" onClick={() => saveReport.mutate({ id })}>
        <ArrowRight className="h-3.5 w-3.5" /> Add to AI Reports
      </Button>
    </div>
  );
}
