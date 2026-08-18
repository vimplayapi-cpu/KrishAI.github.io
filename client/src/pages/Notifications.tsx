import AppLayout from "@/components/AppLayout";
import { MotionPage, NeumorphicCard } from "@/components/Neumorphic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Bell, CheckCheck, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Notifications() {
  const notifications = trpc.notifications.list.useQuery();
  const utils = trpc.useUtils();
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => { utils.notifications.list.invalidate(); },
  });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => { utils.notifications.list.invalidate(); toast.success("All marked read"); },
  });

  return (
    <AppLayout>
      <MotionPage>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-vivid-teal">Notifications</h1>
            <p className="font-ui text-xs text-muted-foreground">Farm alerts, market updates, and platform announcements.</p>
          </div>
          <Button size="sm" variant="outline" className="neu-button surface-sage-deep font-ui text-xs text-primary" onClick={() => markAllRead.mutate()} disabled={!notifications.data?.some((n: any) => !n.read)}>
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </Button>
        </div>

        {notifications.isLoading ? (
          <div className="py-14 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-accent" /></div>
        ) : notifications.data?.length ? (
          <div className="space-y-3">
            {notifications.data.map((n: any) => (
              <div key={n.id} className={`neu-pressed flex items-start justify-between gap-3 rounded-2xl p-4 ${!n.read ? "shadow-soft-sm" : ""}`}>
                <div className="flex items-start gap-3">
                  <Bell className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <div>
                    <h3 className="font-ui text-sm font-semibold text-ink">{n.title}</h3>
                    {n.body ? <p className="font-ui mt-1 text-xs leading-relaxed text-muted-foreground">{n.body}</p> : null}
                    <span className="font-display mt-2 block text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {n.category ? <Badge variant="outline" className="font-ui surface-sage-deep text-[9px] text-primary">{n.category}</Badge> : null}
                  {!n.read ? (
                    <Button size="sm" variant="ghost" className="h-7 w-7 shrink-0 p-0 text-muted-foreground" onClick={() => markRead.mutate({ id: n.id })}>
                      <CheckCheck className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <NeumorphicCard className="flex flex-col items-center gap-3 py-14" delay={0.05}>
            <Sparkles className="h-8 w-8 text-muted-foreground" />
            <p className="font-ui text-xs text-muted-foreground">No notifications yet. Alerts will appear here.</p>
          </NeumorphicCard>
        )}
      </MotionPage>
    </AppLayout>
  );
}
