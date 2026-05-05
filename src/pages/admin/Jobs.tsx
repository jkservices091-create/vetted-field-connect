import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { adminNav } from "@/lib/nav";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { JobStatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/lib/supabase-extras";
import { Loader2 } from "lucide-react";
import { tradeSlugs, tradeTitles, type TradeSlug } from "@/lib/labels";
import { format } from "date-fns";

type AdminJob = {
  id: string;
  title: string;
  status: string;
  city: string | null;
  date_needed: string | null;
  hiring_party_id: string;
  qualification_mode: string | null;
  created_at: string;
};

const AdminJobs = () => {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [companies, setCompanies] = useState<Record<string, string>>({});
  const [tradesByJob, setTradesByJob] = useState<Record<string, string[]>>({});
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tradeFilter, setTradeFilter] = useState<string>("all");
  const [hirerFilter, setHirerFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const [{ data: jobsData }, { data: hpData }, { data: jt }] = await Promise.all([
        sb.from("jobs").select("id, title, status, city, date_needed, hiring_party_id, qualification_mode, created_at").order("created_at", { ascending: false }),
        supabase.from("hiring_party_profiles").select("id, company_name"),
        sb.from("job_trades").select("job_id, trade_slug, is_required").eq("is_required", true),
      ]);
      setJobs((jobsData ?? []) as AdminJob[]);
      const cmap: Record<string, string> = {};
      (hpData ?? []).forEach((h) => (cmap[h.id] = h.company_name));
      setCompanies(cmap);
      const tmap: Record<string, string[]> = {};
      ((jt ?? []) as { job_id: string; trade_slug: string }[]).forEach((row) => {
        (tmap[row.job_id] ??= []).push(row.trade_slug);
      });
      setTradesByJob(tmap);
      setLoading(false);
    })();
  }, []);

  const hirerOptions = useMemo(() => Object.entries(companies), [companies]);

  const filtered = jobs.filter((j) => {
    if (statusFilter !== "all" && j.status !== statusFilter) return false;
    if (hirerFilter !== "all" && j.hiring_party_id !== hirerFilter) return false;
    if (tradeFilter !== "all" && !(tradesByJob[j.id] ?? []).includes(tradeFilter)) return false;
    return true;
  });

  return (
    <AppLayout role="admin" nav={adminNav}>
      <PageHeader eyebrow="Admin" title="All jobs" description="Every job posted, regardless of status." />

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tradeFilter} onValueChange={setTradeFilter}>
              <SelectTrigger><SelectValue placeholder="Trade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All trades</SelectItem>
                {tradeSlugs.map((s) => (
                  <SelectItem key={s} value={s}>{tradeTitles[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={hirerFilter} onValueChange={setHirerFilter}>
              <SelectTrigger><SelectValue placeholder="Hirer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All hirers</SelectItem>
                {hirerOptions.map(([id, name]) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No jobs match these filters.</p>
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold">Job</th>
                    <th className="text-left px-4 py-2 font-semibold">Hirer</th>
                    <th className="text-left px-4 py-2 font-semibold">Trades</th>
                    <th className="text-left px-4 py-2 font-semibold">Status</th>
                    <th className="text-left px-4 py-2 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((j) => {
                    const ts = tradesByJob[j.id] ?? [];
                    return (
                      <tr key={j.id} className="border-t border-border hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <Link to={`/hire/jobs/${j.id}`} className="font-medium underline-offset-2 hover:underline">
                            {j.title}
                          </Link>
                          {j.city && <div className="text-xs text-muted-foreground">{j.city}</div>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{companies[j.hiring_party_id] ?? "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {ts.length === 0 ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              ts.map((s) => (
                                <Badge key={s} variant="secondary" className="text-xs">
                                  {tradeTitles[s as TradeSlug] ?? s}
                                </Badge>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3"><JobStatusBadge status={j.status as "draft" | "open" | "in_progress" | "completed" | "canceled"} /></td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {j.date_needed ? format(new Date(j.date_needed), "MMM d, yyyy") : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
};

export default AdminJobs;
