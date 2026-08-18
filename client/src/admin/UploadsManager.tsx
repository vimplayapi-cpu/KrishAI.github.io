import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ExternalLink, FileText, Microscope, Search, Upload } from "lucide-react";
import { useState } from "react";

export default function UploadsManager() {
  const uploads = trpc.admin.allUploads.useQuery({ limit: 100 });
  const [q, setQ] = useState("");

  const filtered = (uploads.data ?? []).filter((f) =>
    (f.category ?? "").toLowerCase().includes(q.toLowerCase()) ||
    f.url.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-white">
            <Upload className="h-5 w-5 text-emerald-400" /> Uploaded Data
          </h1>
          <p className="text-xs text-slate-400">Full repository of all user-generated scans, research uploads, and imported data.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by category or URL..."
            className="h-9 w-64 rounded-full border-white/10 bg-white/5 pl-9 text-xs text-slate-200"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#10172e]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8 bg-white/[0.03]">
              {["File", "Category", "User", "Status", "Created", "Link"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-display text-[9px] uppercase tracking-widest text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {item.category === "scan" ? (
                      <Microscope className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-sky-400" />
                    )}
                    <span className="font-ui truncate text-[11px] text-slate-200 max-w-[150px]">
                      {item.url.split("/").pop()}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 font-ui text-[11px] text-slate-400 capitalize">{item.category}</td>
                <td className="px-4 py-3 font-ui text-[11px] text-slate-400">User #{item.userId}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={`font-ui text-[9px] ${
                      item.status === "approved"
                        ? "border-emerald-500/30 text-emerald-300"
                        : item.status === "rejected"
                        ? "border-rose-500/30 text-rose-300"
                        : "border-amber-500/30 text-amber-300"
                    }`}
                  >
                    {(item.status ?? "pending").toUpperCase()}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-ui text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <a href={item.url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-emerald-400">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
