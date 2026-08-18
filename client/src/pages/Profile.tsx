import AppLayout from "@/components/AppLayout";
import { MotionPage, NeumorphicCard } from "@/components/Neumorphic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Activity, BookOpen, CheckCircle2, Home, Mail, MapPin, Microscope, Phone, Radar, ScrollText, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const profile = trpc.profile.get.useQuery();
  const stats = trpc.dashboard.widgets.useQuery();
  
  const update = trpc.profile.update.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
      utils.dashboard.widgets.invalidate();
      toast.success("Profile updated — recommendations refreshed!");
    },
    onError: (e) => toast.error(e.message),
  });

  const [isEditing, setIsEditing] = useState(false);

  if (profile.isLoading) return <AppLayout><div>Loading profile...</div></AppLayout>;

  const p = profile.data;

  return (
    <AppLayout>
      <MotionPage>
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-vivid-teal">My Profile</h1>
          <p className="font-ui text-xs text-muted-foreground">Manage your identity, farm details, and academic profile.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* --- Identity Card --- */}
          <div className="lg:col-span-1">
            <NeumorphicCard className="flex flex-col items-center p-6 text-center" delay={0.05}>
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-400 to-emerald-500 text-3xl font-bold text-white shadow-lg">
                {(user?.name ?? "U").slice(0, 1).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-ink">{user?.name}</h2>
              <Badge variant="outline" className={`mt-2 font-ui text-[10px] ${user?.role === "farmer" ? "text-emerald-600 border-emerald-200" : "text-sky-600 border-sky-200"}`}>
                {(user?.role ?? "").toUpperCase()}
              </Badge>
              
              <div className="mt-6 w-full space-y-3 text-left">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Mail className="h-4 w-4 text-teal-500" /> {user?.email}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Phone className="h-4 w-4 text-teal-500" /> {p?.mobile ?? "No phone added"}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <MapPin className="h-4 w-4 text-teal-500" /> {p?.district ? `${p.district}, ${p.state}` : "Location not set"}
                </div>
              </div>

              <Button 
                className="mt-8 w-full btn-vivid-teal font-ui text-xs text-white"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Cancel Editing" : "Edit Profile"}
              </Button>
            </NeumorphicCard>

            <NeumorphicCard className="mt-6 p-5" delay={0.1}>
              <h3 className="font-display mb-4 text-[10px] uppercase tracking-widest text-primary">Activity Overview</h3>
              <div className="grid grid-cols-2 gap-3">
                <StatItem icon={<Microscope className="h-3 w-3" />} label="Scans" value={0} />
                <StatItem icon={<Radar className="h-3 w-3" />} label="Advisory" value={0} />
                <StatItem icon={<ScrollText className="h-3 w-3" />} label="Reports" value={0} />
                <StatItem icon={<BookOpen className="h-3 w-3" />} label="Research" value={0} />
              </div>
            </NeumorphicCard>
          </div>

          {/* --- Detailed Info --- */}
          <div className="lg:col-span-2">
            <NeumorphicCard className="p-6" delay={0.15}>
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-display text-sm font-bold tracking-wide text-ink">
                  {user?.role === "farmer" ? "Farming Details" : "Academic Profile"}
                </h3>
                {p?.onboardingComplete && (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[9px] text-emerald-600">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> VERIFIED
                  </Badge>
                )}
              </div>

              {isEditing ? (
                <form className="space-y-4" onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const data: any = {};
                  fd.forEach((v, k) => { data[k] = v; });
                  update.mutate(data);
                  setIsEditing(false);
                }}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Full Name</label>
                      <Input name="fullName" defaultValue={p?.fullName ?? ""} className="neu-pressed text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Mobile</label>
                      <Input name="mobile" defaultValue={p?.mobile ?? ""} className="neu-pressed text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-500">State</label>
                      <Input name="state" defaultValue={p?.state ?? ""} className="neu-pressed text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-500">District</label>
                      <Input name="district" defaultValue={p?.district ?? ""} className="neu-pressed text-xs" />
                    </div>
                    {user?.role === "farmer" ? (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-500">Experience (Years)</label>
                          <Input name="farmingExperienceYears" type="number" defaultValue={p?.farmingExperienceYears ?? ""} className="neu-pressed text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-500">Soil Type</label>
                          <Input name="soilType" defaultValue={p?.soilType ?? ""} className="neu-pressed text-xs" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-500">University</label>
                          <Input name="universityName" defaultValue={p?.universityName ?? ""} className="neu-pressed text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-500">Graduation Year</label>
                          <Input name="graduationYear" type="number" defaultValue={p?.graduationYear ?? ""} className="neu-pressed text-xs" />
                        </div>
                      </>
                    )}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-500">About Me</label>
                      <Textarea name="aboutMe" defaultValue={p?.aboutMe ?? ""} className="neu-pressed text-xs" rows={3} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full btn-vivid-teal text-white" disabled={update.isPending}>
                    Save Changes
                  </Button>
                </form>
              ) : (
                <div className="space-y-6">
                  {user?.role === "farmer" ? (
                    <div className="grid gap-6 sm:grid-cols-2">
                      <InfoBlock label="Experience" value={`${p?.farmingExperienceYears ?? "—"} Years`} />
                      <InfoBlock label="Soil Type" value={p?.soilType ?? "—"} />
                      <InfoBlock label="Rainfall" value={p?.rainfallType ?? "—"} />
                      <InfoBlock label="Growing Season" value={p?.growingSeason ?? "—"} />
                      <InfoBlock label="Irrigation" value={p?.irrigationAccess ?? "—"} />
                      <InfoBlock label="Status" value={p?.farmOwnerStatus ?? "—"} />
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                      <InfoBlock label="University" value={p?.universityName ?? "—"} />
                      <InfoBlock label="Degree" value={p?.degreeLevel ?? "—"} />
                      <InfoBlock label="Course" value={p?.courseName ?? "—"} />
                      <InfoBlock label="Graduation Year" value={p?.graduationYear?.toString() ?? "—"} />
                      <InfoBlock label="Research Area" value={p?.researchArea ?? "—"} />
                      <InfoBlock label="Purpose" value={p?.purpose ?? "—"} />
                    </div>
                  )}

                  <div className="pt-4 border-t border-border/40">
                    <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3">About Me</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {p?.aboutMe || "Tell us more about your farming or research journey..."}
                    </p>
                  </div>
                </div>
              )}
            </NeumorphicCard>
          </div>
        </div>
      </MotionPage>
    </AppLayout>
  );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="neu-pressed rounded-xl p-3 text-center">
      <div className="flex justify-center mb-1 text-teal-500">{icon}</div>
      <div className="text-lg font-bold text-ink">{value}</div>
      <div className="text-[9px] uppercase tracking-tighter text-muted-foreground">{label}</div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
      <p className="text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
