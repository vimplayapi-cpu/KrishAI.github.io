import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, FileText, Microscope, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function ApprovalsPanel() {
  const utils = trpc.useUtils();
  const pending = trpc.admin.pendingItems.useQuery({ kind: "uploads" });
  const approve = trpc.admin.reviewUpload.useMutation({
    onSuccess: () => {
      utils.admin.pendingItems.invalidate();
      utils.admin.overview.invalidate();
      toast.success("Item approved");
    },
  });

  if (pending.isLoading) return <div className="p-8 text-center text-slate-400">Loading pending approvals...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-white">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" /> Approvals Queue
        </h1>
        <p className="text-xs text-slate-400">Review user uploads and scans before they become public or visible in the main app.</p>
      </div>

      {!pending.data?.length ? (
        <div className="rounded-2xl border border-white/8 bg-[#10172e] p-12 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-500/30" />
          <p className="text-sm text-slate-400">All clear! No pending approvals at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pending.data.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-[#10172e] p-4">
                <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                  {(item as any).crop ? (
                    <Microscope className="h-6 w-6 text-emerald-400" />
                  ) : (
                    <FileText className="h-6 w-6 text-sky-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white capitalize">{(item as any).crop ?? "Upload"}</span>
                    <Badge variant="outline" className="border-amber-400/30 bg-amber-400/10 text-[9px] text-amber-300">PENDING</Badge>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    Uploaded by User #{item.userId} • {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="h-8 gap-1.5 bg-emerald-600 text-[11px] font-bold text-white hover:bg-emerald-700"
                  onClick={() => approve.mutate({ id: item.id, decision: "approved" })}
                  disabled={approve.isPending}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 border-rose-500/30 bg-rose-500/10 text-[11px] font-bold text-rose-300 hover:bg-rose-500/20"
                  onClick={() => approve.mutate({ id: item.id, decision: "rejected", note: "Rejected by admin" })}
                  disabled={approve.isPending}
                >
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
