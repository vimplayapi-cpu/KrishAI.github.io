import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Activity, ArrowLeft, BookOpen, ExternalLink, FileText, Home, Leaf, Mail, MapPin, Microscope, Radar, ScrollText, User } from "lucide-react";

interface UserDetails360Props {
  userId: number;
  onBack: () => void;
}

export default function UserDetails360({ userId, onBack }: UserDetails360Props) {
  const data = trpc.admin.user360.useQuery({ userId });

  if (data.isLoading || !data.data) {
    return <div className="p-8 text-center text-slate-400">Loading user data...</div>;
  }

  const { user, profile, farms, crops, scans, conversations, reports, files, papers } = data.data;

  if (!user) {
    return (
      <div className="p-8 text-center text-slate-400">
        <button onClick={onBack} className="mb-4 flex items-center gap-1 text-xs hover:text-white">
          <ArrowLeft className="h-3 w-3" /> Back
        </button>
        User not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[11px] text-slate-400 transition-colors hover:text-emerald-400"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Customers
      </button>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl font-bold text-white">
            {(user.name ?? "A").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{user.name ?? "Unknown"}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline" className={`border-white/10 font-ui text-[9px] ${user.role === "farmer" ? "text-emerald-300" : "text-sky-300"}`}>
                {(user.role ?? "").toUpperCase()}
              </Badge>
              <span className="text-[10px] text-slate-500">ID: {user.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Profile / Identity --- */}
      <div className="rounded-2xl border border-white/8 bg-[#10172e] p-5">
        <h3 className="font-display mb-4 text-xs uppercase tracking-widest text-emerald-300">Identity & Contact</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3 text-[11px]">
            <Mail className="h-4 w-4 text-slate-500" />
            <span className="text-slate-400">{user.email ?? "—"}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <User className="h-4 w-4 text-slate-500" />
            <span className="text-slate-400">{profile?.mobile ?? "—"}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <MapPin className="h-4 w-4 text-slate-500" />
            <span className="text-slate-400">{profile?.district ?? "—"}, {profile?.state ?? "—"}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <Activity className="h-4 w-4 text-slate-500" />
            <span className="text-slate-400">Last signed in: {new Date(user.lastSignedIn).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* --- Deep Profile / Onboarding --- */}
      <div className="rounded-2xl border border-white/8 bg-[#10172e] p-5">
        <h3 className="font-display mb-4 text-xs uppercase tracking-widest text-emerald-300">Onboarding Profile</h3>
        {user.role === "farmer" ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div><span className="text-[9px] uppercase text-slate-500">Experience</span><div className="text-[11px] text-slate-300">{profile?.farmingExperienceYears ?? "—"} years</div></div>
            <div><span className="text-[9px] uppercase text-slate-500">Soil Type</span><div className="text-[11px] text-slate-300 capitalize">{profile?.soilType ?? "—"}</div></div>
            <div><span className="text-[9px] uppercase text-slate-500">Rainfall</span><div className="text-[11px] text-slate-300 capitalize">{profile?.rainfallType ?? "—"}</div></div>
            <div><span className="text-[9px] uppercase text-slate-500">Season</span><div className="text-[11px] text-slate-300 capitalize">{profile?.growingSeason ?? "—"}</div></div>
            <div><span className="text-[9px] uppercase text-slate-500">Language</span><div className="text-[11px] text-slate-300 capitalize">{profile?.language ?? "—"}</div></div>
            <div><span className="text-[9px] uppercase text-slate-500">Region</span><div className="text-[11px] text-slate-300">{profile?.regionTags ? JSON.stringify(profile.regionTags) : "—"}</div></div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <div><span className="text-[9px] uppercase text-slate-500">Age</span><div className="text-[11px] text-slate-300">{profile?.age ?? "—"}</div></div>
            <div><span className="text-[9px] uppercase text-slate-500">University</span><div className="text-[11px] text-slate-300">{profile?.universityName ?? "—"}</div></div>
            <div><span className="text-[9px] uppercase text-slate-500">Degree</span><div className="text-[11px] text-slate-300">{profile?.degreeLevel ?? "—"}</div></div>
            <div><span className="text-[9px] uppercase text-slate-500">Course</span><div className="text-[11px] text-slate-300">{profile?.courseName ?? "—"}</div></div>
            <div><span className="text-[9px] uppercase text-slate-500">Subjects</span><div className="text-[11px] text-slate-300">{profile?.subjects ? JSON.stringify(profile.subjects) : "—"}</div></div>
            <div><span className="text-[9px] uppercase text-slate-500">Graduation</span><div className="text-[11px] text-slate-300">{profile?.graduationYear ?? "—"}</div></div>
          </div>
        )}
      </div>

      {/* --- Farms (if farmer) --- */}
      {user.role === "farmer" && (
        <div className="rounded-2xl border border-white/8 bg-[#10172e] p-5">
          <h3 className="font-display mb-4 flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-300">
            <Home className="h-3.5 w-3.5" /> Farms
          </h3>
          <div className="space-y-2">
            {(farms ?? []).map((f: any) => (
              <div key={f.id} className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                <span className="text-[11px] font-medium text-slate-200">{f.name}</span>
                <span className="text-[9px] uppercase text-slate-500">{f.acres ?? f.hectares} {f.acres ? "acres" : "hectares"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Recent Activity --- */}
      <div className="rounded-2xl border border-white/8 bg-[#10172e] p-5">
        <h3 className="font-display mb-4 flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-300">
          <Activity className="h-3.5 w-3.5" /> Recent Activity
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-2 text-[11px]"><Microscope className="h-3.5 w-3.5 text-slate-500" /> Scans: <span className="font-bold text-white">{scans?.length ?? 0}</span></div>
          <div className="flex items-center gap-2 text-[11px]"><Radar className="h-3.5 w-3.5 text-slate-500" /> Advisor Chats: <span className="font-bold text-white">{conversations?.length ?? 0}</span></div>
          <div className="flex items-center gap-2 text-[11px]"><ScrollText className="h-3.5 w-3.5 text-slate-500" /> Reports: <span className="font-bold text-white">{reports?.length ?? 0}</span></div>
          <div className="flex items-center gap-2 text-[11px]"><BookOpen className="h-3.5 w-3.5 text-slate-500" /> Research Items: <span className="font-bold text-white">{papers?.length ?? 0}</span></div>
        </div>
      </div>

      {/* --- Uploaded Files --- */}
      <div className="rounded-2xl border border-white/8 bg-[#10172e] p-5">
        <h3 className="font-display mb-4 flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-300">
          <FileText className="h-3.5 w-3.5" /> Uploaded Files ({files?.length ?? 0})
        </h3>
        <div className="space-y-2">
          {(files ?? []).map((f: any) => (
            <div key={f.id} className="flex items-center justify-between rounded-xl bg-white/5 p-3">
              <span className="text-[11px] text-slate-300 truncate max-w-[200px]">{f.url.split("/").pop()}</span>
              <span className={`font-display text-[9px] uppercase ${f.status === "approved" ? "text-emerald-300" : f.status === "rejected" ? "text-rose-300" : "text-amber-300"}`}>{f.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
