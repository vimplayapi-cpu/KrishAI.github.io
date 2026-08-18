import { NeumorphicCard } from "@/components/Neumorphic";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { INDIAN_STATES } from "@shared/locations";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const USER_TYPES = [
  { id: "farmer", label: "Farmer", desc: "Grow, track and protect your crops" },
  { id: "student", label: "Student", desc: "Learn agriculture with AI" },
  { id: "researcher", label: "Researcher", desc: "Papers, data and summaries" },
  { id: "professional", label: "Professional", desc: "Extension & agronomy work" },
  { id: "business", label: "Business", desc: "Agri products & services" },
];

const LOGO = `${import.meta.env.BASE_URL}krishai-logo.svg`;

const SOIL_TYPES = ["Clay", "Sandy", "Loamy", "Silty", "Peaty", "Chalky", "Laterite", "Black Cotton (Regur)", "Alluvial", "Red Soil"];
const RAINFALL_TYPES = ["High (> 200 cm)", "Medium (100–200 cm)", "Low (50–100 cm)", "Very Low (< 50 cm)", "Irrigated only"];
const SEASONS = ["Kharif (Jun–Oct)", "Rabi (Nov–Apr)", "Zaid (Mar–Jun)", "All seasons"];
const IRRIGATION_OPTIONS = ["Canal", "Borewell", "Tube well", "Drip", "Sprinkler", "Rain-fed", "None"];
const OWNER_STATUS = ["Own land", "Leased land", "Family land", "Tenant"];
const DEGREE_LEVELS = ["Diploma", "Undergraduate (BSc/BTech)", "Postgraduate (MSc/MTech)", "PhD", "Certificate course"];
const PURPOSES = ["Learning & curiosity", "Project work", "Thesis / dissertation", "Job preparation", "Research"];

const CROPS_OF_INTEREST = ["Rice", "Wheat", "Maize", "Cotton", "Soybean", "Sugarcane", "Pulses", "Oilseeds", "Vegetables", "Fruits", "Spices", "Tea", "Jute"];

/**
 * First-time user guidance wizard with deep questionnaires:
 * - farmer: location → soil / rainfall / season / irrigation → experience / farm details / crops of interest
 * - student: location → age / university / degree / course / subjects / graduation year
 */
export default function OnboardingWizard({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [userType, setUserType] = useState<string | null>(null);
  const [state, setState] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [village, setVillage] = useState<string>("");
  const [mobile, setMobile] = useState("");
  const [fullName, setFullName] = useState("");

  // Farmer details
  const [soilType, setSoilType] = useState<string>("");
  const [rainfallType, setRainfallType] = useState<string>("");
  const [growingSeason, setGrowingSeason] = useState<string>("");
  const [irrigationAccess, setIrrigationAccess] = useState<string>("");
  const [farmOwnerStatus, setFarmOwnerStatus] = useState<string>("");
  const [experienceYears, setExperienceYears] = useState("");
  const [farmName, setFarmName] = useState("");
  const [cropsOfInterest, setCropsOfInterest] = useState<string[]>([]);
  const [aboutMe, setAboutMe] = useState("");

  // Student details
  const [age, setAge] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [degreeLevel, setDegreeLevel] = useState<string>("");
  const [courseName, setCourseName] = useState("");
  const [subjectsText, setSubjectsText] = useState("");
  const [researchArea, setResearchArea] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [purpose, setPurpose] = useState<string>("");

  const utils = trpc.useUtils();
  const statesQuery = trpc.profile.states.useQuery();
  const locationsQuery = trpc.profile.locations.useQuery({ state }, { enabled: Boolean(state) });
  const states = statesQuery.data ?? [];
  const locations = locationsQuery.data;
  const districtNames = locations?.districts ? Object.keys(locations.districts as Record<string, unknown>) : [];
  const villages = district && locations?.districts?.[district] ? (locations.districts[district] as string[]) : [];

  const createFarm = trpc.farms.create.useMutation();
  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: async () => {
      if (userType === "farmer" && farmName.trim()) {
        await createFarm.mutateAsync({
          name: farmName.trim(),
          state: state || undefined,
          district: district || undefined,
          village: village || undefined,
          soilType: soilType || undefined,
          irrigation: irrigationAccess || undefined,
        });
      }
      await utils.profile.get.invalidate();
      await utils.dashboard.widgets.invalidate();
      await utils.farms.list.invalidate();
      toast.success("Profile saved — your hub is ready!");
      onDone();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleCrop = (crop: string) => {
    setCropsOfInterest((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  };

  const finish = () => {
    const base = {
      userType: userType ?? "farmer",
      state, district, village, mobile,
      fullName: fullName || undefined,
      onboardingComplete: true,
    };
    const farmer = {
      soilType: soilType || undefined,
      rainfallType: rainfallType || undefined,
      growingSeason: growingSeason || undefined,
      irrigationAccess: irrigationAccess || undefined,
      farmOwnerStatus: farmOwnerStatus || undefined,
        farmingExperienceYears: experienceYears ? parseInt(experienceYears) : undefined,
        cropsOfInterest,
        onboardingAnswers: { farmName: farmName || undefined, experienceYears },
      aboutMe: aboutMe || undefined,
    };
    const student = {
      age: age ? parseInt(age) : undefined,
      universityName: universityName || undefined,
      degreeLevel: degreeLevel || undefined,
      courseName: courseName || undefined,
      subjects: subjectsText ? subjectsText.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      researchArea: researchArea || undefined,
      graduationYear: graduationYear ? parseInt(graduationYear) : undefined,
      purpose: purpose || undefined,
    };
    updateProfile.mutate({ ...base, ...(userType === "farmer" ? farmer : student) });
  };

  // Determine steps based on user type
  const getSteps = () => {
    if (!userType || userType === "farmer") {
      return ["Who are you?", "Where are you?", "Your farming context", "Farm & crops"];
    }
    if (userType === "student") {
      return ["Who are you?", "Where are you?", "Your academic details"];
    }
    return ["Who are you?", "Where are you?", "About you"];
  };
  const stepTitles = getSteps();
  const stepCount = stepTitles.length;

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid px-4 py-8">
      <NeumorphicCard className="w-full max-w-2xl p-6 md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <img src={LOGO} alt="KrishAI Hub" className="h-12 w-12 drop-shadow-[0_0_14px_rgba(34,211,238,0.4)]" />
          <div>
            <h1 className="font-display text-xl font-bold text-ink">Welcome to KrishAI Hub</h1>
            <p className="font-ui text-xs text-muted-foreground">Step {step + 1} of {stepCount} — {stepTitles[step]!}</p>
          </div>
        </div>

        {/* progress */}
        <div className="mb-6 flex gap-2">
          {Array.from({ length: stepCount }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>

        {/* Step 0: User type */}
        {step === 0 && (
          <div className="space-y-2.5">
            {USER_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setUserType(t.id)}
                className={`neu-button w-full rounded-2xl px-4 py-3 text-left ${userType === t.id ? "shadow-soft-sm surface-sage" : ""}`}
              >
                <span className="font-ui block text-sm font-semibold text-ink">{t.label}</span>
                <span className="font-ui block text-xs text-muted-foreground">{t.desc}</span>
              </button>
            ))}
            <div className="space-y-1.5 mt-4">
              <Label className="font-ui text-xs">Your full name (optional)</Label>
              <Input className="neu-pressed font-ui" placeholder="e.g. Ramesh Kumar" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 1: Location (common) */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-ui text-xs">State</Label>
              <Select value={state || undefined} onValueChange={(v) => { setState(v); setDistrict(""); setVillage(""); }}>
                <SelectTrigger className="w-full neu-pressed font-ui"><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent>
                  {states?.map((s) => (
                    <SelectItem key={s} value={s} className="font-ui">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {districtNames.length > 0 && (
              <div className="space-y-1.5">
                <Label className="font-ui text-xs">District</Label>
                <Select value={district || undefined} onValueChange={(v) => { setDistrict(v); setVillage(""); }}>
                  <SelectTrigger className="w-full neu-pressed font-ui"><SelectValue placeholder="Select district" /></SelectTrigger>
                  <SelectContent>
                    {districtNames.map((d) => (
                      <SelectItem key={d} value={d} className="font-ui">{d}</SelectItem>
                    ))}
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
                    {villages.map((v) => (
                      <SelectItem key={v} value={v} className="font-ui">{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {state && villages.length === 0 && (
              <div className="space-y-1.5">
                <Label className="font-ui text-xs">Village / Town (optional)</Label>
                <Input className="neu-pressed font-ui" placeholder="Type your village or town" value={village} onChange={(e) => setVillage(e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="font-ui text-xs">Mobile number (optional)</Label>
              <Input className="neu-pressed font-ui" placeholder="+91 00000 00000" value={mobile} onChange={(e) => setMobile(e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 2: Farmer context OR Student academic details */}
        {step === 2 && userType === "farmer" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="font-ui text-xs">Soil Type</Label>
              <Select value={soilType || undefined} onValueChange={setSoilType}>
                <SelectTrigger className="w-full neu-pressed font-ui"><SelectValue placeholder="Select soil type" /></SelectTrigger>
                <SelectContent>
                  {SOIL_TYPES.map((s) => (
                    <SelectItem key={s} value={s} className="font-ui">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-ui text-xs">Rainfall Pattern</Label>
              <Select value={rainfallType || undefined} onValueChange={setRainfallType}>
                <SelectTrigger className="w-full neu-pressed font-ui"><SelectValue placeholder="Select rainfall" /></SelectTrigger>
                <SelectContent>
                  {RAINFALL_TYPES.map((r) => (
                    <SelectItem key={r} value={r} className="font-ui">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-ui text-xs">Growing Season</Label>
              <Select value={growingSeason || undefined} onValueChange={setGrowingSeason}>
                <SelectTrigger className="w-full neu-pressed font-ui"><SelectValue placeholder="Select season" /></SelectTrigger>
                <SelectContent>
                  {SEASONS.map((s) => (
                    <SelectItem key={s} value={s} className="font-ui">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-ui text-xs">Irrigation Access</Label>
              <Select value={irrigationAccess || undefined} onValueChange={setIrrigationAccess}>
                <SelectTrigger className="w-full neu-pressed font-ui"><SelectValue placeholder="Select irrigation" /></SelectTrigger>
                <SelectContent>
                  {IRRIGATION_OPTIONS.map((i) => (
                    <SelectItem key={i} value={i} className="font-ui">{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-ui text-xs">Experience (years)</Label>
              <Input className="neu-pressed font-ui" type="number" placeholder="e.g. 10" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-ui text-xs">Land Ownership</Label>
              <Select value={farmOwnerStatus || undefined} onValueChange={setFarmOwnerStatus}>
                <SelectTrigger className="w-full neu-pressed font-ui"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {OWNER_STATUS.map((o) => (
                    <SelectItem key={o} value={o} className="font-ui">{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="font-ui text-xs">About your farm (optional)</Label>
              <Textarea className="neu-pressed font-ui" placeholder="Tell us about your land, challenges, goals..." rows={3} value={aboutMe} onChange={(e) => setAboutMe(e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && userType === "student" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="font-ui text-xs">Age</Label>
              <Input className="neu-pressed font-ui" type="number" placeholder="e.g. 20" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-ui text-xs">Degree Level</Label>
              <Select value={degreeLevel || undefined} onValueChange={setDegreeLevel}>
                <SelectTrigger className="w-full neu-pressed font-ui"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {DEGREE_LEVELS.map((d) => (
                    <SelectItem key={d} value={d} className="font-ui">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="font-ui text-xs">University Name</Label>
              <Input className="neu-pressed font-ui" placeholder="e.g. Indian Agricultural Research Institute" value={universityName} onChange={(e) => setUniversityName(e.target.value)} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="font-ui text-xs">Course Name</Label>
              <Input className="neu-pressed font-ui" placeholder="e.g. BSc Agriculture" value={courseName} onChange={(e) => setCourseName(e.target.value)} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="font-ui text-xs">Subjects (comma-separated)</Label>
              <Input className="neu-pressed font-ui" placeholder="e.g. Agronomy, Plant Pathology, Soil Science" value={subjectsText} onChange={(e) => setSubjectsText(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-ui text-xs">Research Area (optional)</Label>
              <Input className="neu-pressed font-ui" placeholder="e.g. Crop genetics" value={researchArea} onChange={(e) => setResearchArea(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-ui text-xs">Graduation Year</Label>
              <Input className="neu-pressed font-ui" type="number" placeholder="e.g. 2026" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="font-ui text-xs">Your Purpose</Label>
              <Select value={purpose || undefined} onValueChange={setPurpose}>
                <SelectTrigger className="w-full neu-pressed font-ui"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {PURPOSES.map((p) => (
                    <SelectItem key={p} value={p} className="font-ui">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 2 && userType && !["farmer", "student"].includes(userType) && (
          <div className="space-y-1.5">
            <Label className="font-ui text-xs">Tell us about yourself</Label>
            <Textarea className="neu-pressed font-ui" rows={4} placeholder="Your background, experience, interests..." value={aboutMe} onChange={(e) => setAboutMe(e.target.value)} />
          </div>
        )}

        {/* Step 3 (farmer): Farm name + crops of interest */}
        {step === 3 && userType === "farmer" && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label className="font-ui text-xs">Farm Name</Label>
              <Input className="neu-pressed font-ui" placeholder="e.g. Green Acres" value={farmName} onChange={(e) => setFarmName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="font-ui text-xs">Crops you grow or are interested in</Label>
              <div className="grid grid-cols-3 gap-2">
                {CROPS_OF_INTEREST.map((crop) => (
                  <label key={crop} className={`neu-button flex items-center gap-2 rounded-xl px-3 py-2 text-xs cursor-pointer ${cropsOfInterest.includes(crop) ? "shadow-soft-sm surface-sage text-ink" : "text-muted-foreground"}`}>
                    <Checkbox checked={cropsOfInterest.includes(crop)} onCheckedChange={() => toggleCrop(crop)} className="h-3 w-3" />
                    <span className="font-ui">{crop}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            className="neu-button font-ui"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || updateProfile.isPending}
          >
            Back
          </Button>
          {step < stepCount - 1 ? (
            <Button
              className="neu-button btn-vivid-teal font-ui text-white"
              onClick={() => setStep((s) => Math.min(stepCount - 1, s + 1))}
              disabled={(step === 0 && !userType) || (step === 1 && (!state || !district))}
            >
              Continue
            </Button>
          ) : (
            <Button className="neu-button btn-vivid-green font-ui text-white" onClick={finish} disabled={updateProfile.isPending || createFarm.isPending}>
              {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Open My Hub
            </Button>
          )}
        </div>
      </NeumorphicCard>
    </div>
  );
}

export { USER_TYPES };
