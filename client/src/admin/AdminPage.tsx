import { MotionPage, NeumorphicCard } from "@/components/Neumorphic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Activity, AlertTriangle, Database, DatabaseZap, FileDown, Loader2, ShieldCheck, Trash2, Upload, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ROLES = ["farmer", "student", "researcher", "professional", "business", "user", "admin"] as const;

export default function Admin() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const users = trpc.admin.listUsers.useQuery();
  const audits = trpc.admin.auditLogs.useQuery();
  const health = trpc.admin.systemHealth.useQuery();
  const settings = trpc.admin.settings.useQuery();
  const [importOpen, setImportOpen] = useState(false);

  const invalidate = () => {
    utils.admin.listUsers.invalidate();
    utils.admin.auditLogs.invalidate();
    utils.admin.systemHealth.invalidate();
    utils.admin.settings.invalidate();
  };

  const setRole = trpc.admin.setRole.useMutation({ onSuccess: () => { invalidate(); toast.success("Role updated"); }, onError: (e) => toast.error(e.message) });
  const deleteUser = trpc.admin.deleteUser.useMutation({ onSuccess: () => { invalidate(); toast.success("User deleted"); }, onError: (e) => toast.error(e.message) });
  const setSetting = trpc.admin.setSetting.useMutation({ onSuccess: () => { invalidate(); toast.success("Setting saved"); }, onError: (e) => toast.error(e.message) });
  const importData = trpc.admin.importData.useMutation({
    onSuccess: (r: any) => { invalidate(); toast.success(`${r.imported} rows imported`); setImportOpen(false); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <MotionPage>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-peach" />
          <h1 className="font-display text-2xl font-bold text-vivid-rose">Admin Control</h1>
          <Badge variant="outline" className="font-ui surface-rose text-[10px] text-rose">ADMIN ONLY</Badge>
        </div>
        <p className="font-ui text-xs text-muted-foreground">User management, audit trail, system health, feature flags, and bulk data import.</p>
      </div>

      {user?.role !== "admin" ? (
        <NeumorphicCard className="flex flex-col items-center gap-3 py-14" delay={0.05}>
          <AlertTriangle className="h-8 w-8 text-warning" />
          <p className="font-ui text-sm text-peach">You do not have admin privileges.</p>
        </NeumorphicCard>
      ) : (
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="neu-pressed flex-wrap">
            <TabsTrigger value="users" className="font-ui data-[state=active]:text-primary">Users</TabsTrigger>
            <TabsTrigger value="audit" className="font-ui data-[state=active]:text-primary">Audit Logs</TabsTrigger>
            <TabsTrigger value="settings" className="font-ui data-[state=active]:text-primary">Settings</TabsTrigger>
            <TabsTrigger value="health" className="font-ui data-[state=active]:text-primary">System Health</TabsTrigger>
            <TabsTrigger value="import" className="font-ui data-[state=active]:text-primary">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <NeumorphicCard className="p-5" delay={0.05}>
              {users.data?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="font-display pb-2 text-left text-[10px] uppercase tracking-widest text-primary">User</th>
                        <th className="font-display pb-2 text-left text-[10px] uppercase tracking-widest text-primary">Email</th>
                        <th className="font-display pb-2 text-left text-[10px] uppercase tracking-widest text-primary">Role</th>
                        <th className="font-display pb-2 text-left text-[10px] uppercase tracking-widest text-primary">Signed in</th>
                        <th className="font-display pb-2 text-right text-[10px] uppercase tracking-widest text-primary">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.data.map((u: any) => (
                        <tr key={u.id} className="border-b border-border/30">
                          <td className="py-2.5 font-ui text-sm font-semibold text-ink">{u.name || "—"}</td>
                          <td className="py-2.5 font-ui text-xs text-muted-foreground">{u.email || "—"}</td>
                          <td className="py-2.5">
                            <Select value={u.role} onValueChange={(r) => setRole.mutate({ userId: u.id, role: r as any })}>
                              <SelectTrigger className="w-32 h-8 neu-pressed font-ui text-[11px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {ROLES.map((r) => <SelectItem key={r} value={r} className="font-ui text-xs">{r}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-2.5 font-ui text-[11px] text-muted-foreground">{new Date(u.lastSignedIn).toLocaleString()}</td>
                          <td className="py-2.5 text-right">
                            <Button size="sm" variant="ghost" className="h-7 w-7 shrink-0 p-0 text-warning" onClick={() => deleteUser.mutate({ userId: u.id })} disabled={u.id === user?.id}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="font-ui flex items-center gap-2 py-8 text-center text-xs text-muted-foreground"><Users className="h-4 w-4" /> Loading users…</p>
              )}
            </NeumorphicCard>
          </TabsContent>

          <TabsContent value="audit">
            <NeumorphicCard className="p-5" delay={0.05}>
              {audits.data?.length ? (
                <div className="max-h-[50vh] space-y-2 overflow-y-auto">
                  {audits.data.map((a: any) => (
                    <div key={a.id} className="neu-pressed flex items-center justify-between rounded-xl px-3.5 py-2.5">
                      <div>
                        <span className="font-display block text-[10px] uppercase tracking-widest text-primary">{a.action}</span>
                        <span className="font-ui text-[11px] text-muted-foreground">{a.detail ?? ""}</span>
                      </div>
                      <span className="font-display shrink-0 text-[10px] text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-ui flex items-center gap-2 py-8 text-center text-xs text-muted-foreground"><Activity className="h-4 w-4" /> Loading audit trail…</p>
              )}
            </NeumorphicCard>
          </TabsContent>

          <TabsContent value="settings">
            <NeumorphicCard className="p-5" delay={0.05}>
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(settings.data ?? {}).map(([key, value]) => (
                  <div key={key} className="space-y-1.5">
                    <label className="font-display text-[10px] uppercase tracking-widest text-primary">{key}</label>
                    <div className="flex gap-2">
                      <Input className="neu-pressed font-ui" defaultValue={value ?? ""} id={`setting-${key}`} />
                      <Button size="sm" className="neu-button btn-vivid-blue shrink-0 font-ui text-[10px] text-white" onClick={() => setSetting.mutate({ key, value: (document.getElementById(`setting-${key}`) as HTMLInputElement).value })}>Save</Button>
                    </div>
                  </div>
                ))}
              </div>
            </NeumorphicCard>
          </TabsContent>

          <TabsContent value="health">
            <div className="grid gap-4 md:grid-cols-2">
              <NeumorphicCard className="p-5" delay={0.05}>
                <h3 className="font-display mb-4 text-sm font-semibold tracking-widest text-primary">SERVICES</h3>
                <div className="space-y-3">
                  <ServiceRow label="Database" value={health.data?.database ?? "—"} />
                  <ServiceRow label="LLM Engine" value={health.data?.llm ?? "—"} />
                </div>
              </NeumorphicCard>
              <NeumorphicCard className="p-5" delay={0.1}>
                <h3 className="font-display mb-4 text-sm font-semibold tracking-widest text-primary">STATISTICS</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(health.data?.stats ?? {}).map(([k, v]) => (
                    <div key={k} className="neu-pressed rounded-xl p-3 text-center">
                      <span className="font-display block text-xl font-bold text-ink">{String(v)}</span>
                      <span className="font-ui block text-[10px] uppercase tracking-widest text-muted-foreground">{k}</span>
                    </div>
                  ))}
                </div>
              </NeumorphicCard>
            </div>
          </TabsContent>

          <TabsContent value="import">
            <NeumorphicCard className="p-5" delay={0.05}>
              <h3 className="font-display mb-2 text-sm font-semibold tracking-widest text-peach">BULK IMPORT</h3>
              <p className="font-ui mb-4 text-xs text-muted-foreground">Paste CSV (with header) or JSON array. Up to 500 rows. Imported rows become reports in your account.</p>
              <Button className="neu-button btn-vivid-blue font-ui text-xs text-white" onClick={() => setImportOpen(true)}>
                <Upload className="h-3.5 w-3.5" /> Open Import
              </Button>
            </NeumorphicCard>
          </TabsContent>
        </Tabs>
      )}

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} importData={importData} />
    </MotionPage>
  );
}

function ServiceRow({ label, value }: { label: string; value: string }) {
  const ok = value === "connected" || value === "configured";
  return (
    <div className="neu-pressed flex items-center justify-between rounded-xl px-3.5 py-2.5">
      <span className="font-ui text-xs text-muted-foreground">{label}</span>
      <span className={`font-display flex items-center gap-1.5 text-[11px] uppercase tracking-widest ${ok ? "text-primary" : "text-peach"}`}>
        {ok ? <Database className="h-3 w-3" /> : <DatabaseZap className="h-3 w-3" />} {value}
      </span>
    </div>
  );
}

function ImportDialog({ open, onClose, importData }: { open: boolean; onClose: () => void; importData: any }) {
  const [type, setType] = useState<"csv" | "json">("json");
  const [content, setContent] = useState("");
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass border-border/60 max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-sm tracking-wide text-ink">Bulk Import (CSV / JSON)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={type} onValueChange={(t) => setType(t as "csv" | "json")}>
            <SelectTrigger className="w-full neu-pressed font-ui text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="json" className="font-ui">JSON array</SelectItem>
              <SelectItem value="csv" className="font-ui">CSV with header</SelectItem>
            </SelectContent>
          </Select>
          <Textarea className="neu-pressed font-ui" rows={10} placeholder={type === "json" ? '[{ "title": "Report 1", "body": "…" }, …]' : "title,body\nReport 1,text…"} value={content} onChange={(e) => setContent(e.target.value)} />
          <Button className="w-full neu-button btn-vivid-blue font-ui text-xs text-white" disabled={!content.trim() || importData.isPending} onClick={() => importData.mutate({ type, content: content.trim() })}>
            {importData.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />} Import Rows
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
