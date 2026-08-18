import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import OnboardingWizard from "@/components/OnboardingWizard";
import { FreshnessBadge, MotionPage, NeumorphicCard } from "@/components/Neumorphic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { INDIAN_STATES } from "@shared/locations";
import { Loader2, MapPin, Plus, Sprout, Trash2, Wheat } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const STAGES = [
  { id: "land_preparation", label: "Land Prep", pct: 0 },
  { id: "sowing", label: "Sowing", pct: 10 },
  { id: "germination", label: "Germination", pct: 20 },
  { id: "vegetative", label: "Vegetative", pct: 40 },
  { id: "flowering", label: "Flowering", pct: 60 },
  { id: "fruiting", label: "Fruiting", pct: 75 },
  { id: "maturity", label: "Maturity", pct: 90 },
  { id: "harvest", label: "Harvest", pct: 97 },
  { id: "post_harvest", label: "Post-Harvest", pct: 100 },
] as const;

const SOIL_TYPES = ["Alluvial", "Black (Regur)", "Red", "Laterite", "Sandy", "Loamy", "Clay", "Other"];
const IRRIGATION = ["Rainfed", "Well", "Canal", "Drip", "Sprinkler", "Borewell", "Mixed"];
const METHODS = ["Conventional", "Organic", "Natural Farming", "Integrated"];

export default function Farms() {
  const profile = trpc.profile.get.useQuery();
  const utils = trpc.useUtils();
  const farms = trpc.farms.list.useQuery();
  const [addOpen, setAddOpen] = useState(false);
  const [stageOpenFor, setStageOpenFor] = useState<{ id: number; farmId: number } | null>(null);
  const [guideFor, setGuideFor] = useState<{ cropId: number; farmId: number; name: string; stage: string } | null>(null);

  if (profile.data && !profile.data.onboardingComplete) {
    return <OnboardingWizard onDone={() => utils.profile.get.invalidate()} />;
  }

  return (
    <AppLayout>
      <MotionPage>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-vivid-green">My Farms</h1>
            <p className="font-ui text-xs text-muted-foreground">Track farms and crop lifecycles from land preparation to harvest.</p>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="neu-button btn-vivid-green font-ui text-white">
                <Plus className="h-4 w-4" /> Add Farm
              </Button>
            </DialogTrigger>
            <FarmDialog
              onClose={() => setAddOpen(false)}
              onSaved={() => {
                utils.farms.list.invalidate();
                utils.dashboard.widgets.invalidate();
                setAddOpen(false);
                toast.success("Farm saved!");
              }}
            />
          </Dialog>
        </div>

        {farms.data?.length ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {farms.data.map((farm, i) => (
              <FarmCard
                key={farm.id}
                farm={farm}
                delay={i * 0.06}
                onStage={(c) => setStageOpenFor(c)}
                onGuide={(c) => setGuideFor({ cropId: c.id, farmId: c.farmId, name: c.name, stage: c.stage ?? "land_preparation" })}
                onRemoved={() => utils.farms.list.invalidate()}
              />
            ))}
          </div>
        ) : (
          <NeumorphicCard className="flex flex-col items-center gap-3 p-10 text-center" delay={0.1}>
            <Wheat className="h-8 w-8 text-muted-foreground" />
            <p className="font-ui text-sm text-muted-foreground">No farms yet. Add your first farm to start tracking crops.</p>
          </NeumorphicCard>
        )}

        <StageDialog
          cropId={stageOpenFor?.id ?? null}
          farmId={stageOpenFor?.farmId ?? null}
          onDone={() => { utils.farms.list.invalidate(); utils.dashboard.widgets.invalidate(); }}
        />
        <GuideDialog guide={guideFor} onClose={() => setGuideFor(null)} />
      </MotionPage>
    </AppLayout>
  );
}

function FarmCard({ farm, delay, onStage, onGuide, onRemoved }: { farm: any; delay: number; onStage: (c: { id: number; farmId: number }) => void; onGuide: (c: any) => void; onRemoved: () => void }) {
  const utils = trpc.useUtils();
  const deleteFarm = trpc.farms.delete.useMutation({
    onSuccess: () => { utils.farms.list.invalidate(); toast.success("Farm removed"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <NeumorphicCard className="p-5" delay={delay}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">{farm.name}</h3>
          <p className="font-ui flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {[farm.village, farm.district, farm.state].filter(Boolean).join(", ")}
          </p>
          <p className="font-ui mt-1 text-xs text-muted-foreground">
            {farm.farmSize ? `${farm.farmSize}` : ""}{farm.soilType ? ` · ${farm.soilType} soil` : ""}{farm.irrigation ? ` · ${farm.irrigation}` : ""}
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteFarm.mutate({ farmId: farm.id })}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-3">
        {farm.crops?.length ? farm.crops.map((crop: any) => (
          <div key={crop.id} className="neu-pressed rounded-2xl p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sprout className="h-4 w-4 text-text-success" />
                <span className="font-ui text-sm font-semibold text-ink">{crop.name}</span>
                {crop.variety ? <Badge variant="outline" className="surface-sage-deep font-ui text-[10px] text-primary">{crop.variety}</Badge> : null}
              </div>
              <span className="font-display rounded-full surface-sage px-2.5 py-0.5 text-[10px] font-semibold tracking-widest text-primary">
                {STAGES.find((s) => s.id === crop.stage)?.label ?? crop.stage}
              </span>
            </div>
            <Progress value={STAGES.find((s) => s.id === crop.stage)?.pct ?? 0} className="h-1.5" />
            <div className="mt-2.5 flex flex-wrap gap-2">
              <Button size="sm" className="neu-button font-ui text-[11px]" onClick={() => onStage({ id: crop.id, farmId: farm.id })}>
                Advance Stage
              </Button>
              <Button size="sm" variant="outline" className="neu-button surface-sage-deep font-ui text-[11px] text-primary" onClick={() => onGuide({ ...crop, farmId: farm.id })}>
                AI Stage Guidance
              </Button>
            </div>
          </div>
        )) : (
          <p className="font-ui text-xs text-muted-foreground">No crops on this farm yet — click "Add Crop" below.</p>
        )}
      </div>
      <AddCropInline farmId={farm.id} onAdded={() => utils.farms.list.invalidate()} />
    </NeumorphicCard>
  );
}

function AddCropInline({ farmId, onAdded }: { farmId: number; onAdded: () => void }) {
  const [name, setName] = useState("");
  const addCrop = trpc.crops.create.useMutation({
    onSuccess: () => { onAdded(); setName(""); toast.success("Crop added"); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <div className="mt-3 flex gap-2">
      <Input className="neu-pressed font-ui text-sm" placeholder="Crop name (e.g. Wheat)" value={name} onChange={(e) => setName(e.target.value)} />
      <Button size="sm" className="neu-button btn-vivid-green font-ui text-white" onClick={() => addCrop.mutate({ farmId, name })} disabled={!name.trim() || addCrop.isPending}>
        {addCrop.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Add Crop
      </Button>
    </div>
  );
}

function StageDialog({ cropId, farmId, onDone }: { cropId: number | null; farmId: number | null; onDone: () => void }) {
  const setStage = trpc.crops.updateStage.useMutation({
    onSuccess: () => { onDone(); toast.success("Stage updated"); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={cropId !== null} onOpenChange={(o) => !o && setStage.reset()}>
      <DialogContent className="glass border-border/60 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-sm tracking-wide text-ink">Crop Lifecycle Stage</DialogTitle>
        </DialogHeader>
        {cropId !== null && (
          <div className="grid grid-cols-3 gap-2">
            {STAGES.map((s) => (
              <button
                key={s.id}
                className={`neu-button rounded-2xl px-2 py-2.5 text-center ${s.id === "post_harvest" ? "shadow-soft-sm" : ""}`}
                onClick={() => cropId !== null && farmId !== null && setStage.mutate({ cropId, farmId, stage: s.id as never })}
                disabled={setStage.isPending || cropId === null || farmId === null}
              >
                <span className="font-ui block text-[11px] font-semibold text-ink">{s.label}</span>
                <span className="font-display block text-[9px] text-muted-foreground">{s.pct}%</span>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function GuideDialog({ guide, onClose }: { guide: { cropId: number; name: string; stage: string; farmId: number } | null; onClose: () => void }) {
  const stageGuide = trpc.crops.stageGuidance.useQuery(
    { cropId: guide?.cropId ?? 0, farmId: guide?.farmId ?? 0 },
    { enabled: guide !== null },
  );
  return (
    <Dialog open={guide !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass border-border/60 max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-sm tracking-wide text-ink">
            AI Guidance — {guide?.name} ({STAGES.find((s) => s.id === guide?.stage)?.label})
          </DialogTitle>
        </DialogHeader>
        {stageGuide.isLoading ? (
          <div className="py-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-accent" /></div>
        ) : (
          <div className="space-y-3">
            <p className="font-ui text-sm leading-relaxed">{stageGuide.data?.guidance?.answer ?? "No guidance available."}</p>
            {stageGuide.data?.guidance?.sourceLabels?.map((label: string, i: number) => (
              <FreshnessBadge key={i} value={label === "LIVE" || label === "CACHED" || label === "INFERRED" ? (label as any) : "INFERRED"} />
            ))}
            {stageGuide.data?.guidance?.disclaimer ? (
              <p className="font-ui rounded-xl border border-border/50 bg-background/50 p-3 text-[11px] leading-relaxed text-muted-foreground">{stageGuide.data.guidance.disclaimer}</p>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FarmDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [village, setVillage] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [soilType, setSoilType] = useState("");
  const [irrigation, setIrrigation] = useState("");
  const [method, setMethod] = useState("");

  const locations = Boolean(state) ? utils.profile.locations.getData({ state }) : undefined;
  const districtNames = locations?.districts ? Object.keys(locations.districts as Record<string, unknown>) : [];
  const villages = district && locations?.districts?.[district] ? (locations.districts[district] as string[]) : [];

  useEffect(() => {
    // prefill from profile
    const p = utils.profile.get.getData();
    if (p?.state && !state) setState(p.state);
  }, []);

  const createFarm = trpc.farms.create.useMutation({
    onSuccess: () => { onSaved(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <DialogContent className="glass border-border/60 max-h-[85vh] max-w-lg overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-display text-sm tracking-wide text-ink">Add a Farm</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="font-ui text-xs">Farm name</Label>
          <Input className="neu-pressed font-ui" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. East Field" />
        </div>
        <div className="space-y-1.5">
          <Label className="font-ui text-xs">State</Label>
          <Select value={state || undefined} onValueChange={(v) => { setState(v); setDistrict(""); setVillage(""); }}>
            <SelectTrigger className="w-full neu-pressed font-ui"><SelectValue placeholder="Select state" /></SelectTrigger>
            <SelectContent>
              {INDIAN_STATES.map((s) => <SelectItem key={s} value={s} className="font-ui">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {districtNames.length > 0 && (
          <div className="space-y-1.5">
            <Label className="font-ui text-xs">District</Label>
            <Select value={district || undefined} onValueChange={(v) => { setDistrict(v); setVillage(""); }}>
              <SelectTrigger className="w-full neu-pressed font-ui"><SelectValue placeholder="Select district" /></SelectTrigger>
              <SelectContent>
                {districtNames.map((d) => <SelectItem key={d} value={d} className="font-ui">{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {villages.length > 0 && (
          <div className="space-y-1.5">
            <Label className="font-ui text-xs">Village / Town</Label>
            <Select value={village || undefined} onValueChange={setVillage}>
              <SelectTrigger className="w-full neu-pressed font-ui"><SelectValue placeholder="Select village / town" /></SelectTrigger>
              <SelectContent>
                {villages.map((v) => <SelectItem key={v} value={v} className="font-ui">{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1.5">
          <Label className="font-ui text-xs">Area / size (optional)</Label>
          <Input className="neu-pressed font-ui" value={farmSize} onChange={(e) => setFarmSize(e.target.value)} placeholder="e.g. 3 acres" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1.5">
            <Label className="font-ui text-xs">Soil</Label>
            <Select value={soilType || undefined} onValueChange={setSoilType}>
              <SelectTrigger className="w-full neu-pressed font-ui text-xs"><SelectValue placeholder="Soil" /></SelectTrigger>
              <SelectContent>{SOIL_TYPES.map((s) => <SelectItem key={s} value={s} className="font-ui text-xs">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="font-ui text-xs">Irrigation</Label>
            <Select value={irrigation || undefined} onValueChange={setIrrigation}>
              <SelectTrigger className="w-full neu-pressed font-ui text-xs"><SelectValue placeholder="Irrigation" /></SelectTrigger>
              <SelectContent>{IRRIGATION.map((s) => <SelectItem key={s} value={s} className="font-ui text-xs">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="font-ui text-xs">Method</Label>
            <Select value={method || undefined} onValueChange={setMethod}>
              <SelectTrigger className="w-full neu-pressed font-ui text-xs"><SelectValue placeholder="Method" /></SelectTrigger>
              <SelectContent>{METHODS.map((s) => <SelectItem key={s} value={s} className="font-ui text-xs">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <Button
          className="w-full neu-button btn-vivid-green font-ui text-white"
          onClick={() => createFarm.mutate({ name, state, district, village, farmSize, soilType, irrigation, farmingMethod: method })}
          disabled={!name.trim() || !state || !district || createFarm.isPending}
        >
          {createFarm.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save Farm
        </Button>
      </div>
    </DialogContent>
  );
}
