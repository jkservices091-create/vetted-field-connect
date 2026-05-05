import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { workerNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/lib/supabase-extras";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, MapPin, Calendar, Clock, Lock, CheckCircle2 } from "lucide-react";
import { jobCategories, tradeTitles, type TradeSlug } from "@/lib/labels";
import { format } from "date-fns";
import { qualifiesForJob, type WorkerBadge } from "@/lib/jobQualification";

type Job = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  city: string | null;
  date_needed: string | null;
  start_time: string | null;
  estimated_duration_hours: number | null;
  budget_type: "hourly" | "flat";
  budget_amount: number;
  workers_needed: number;
  hiring_party_id: string;
  qualification_mode?: "any" | "all" | null;
  status?: string;
};

type JobTrade = { job_id: string; trade_slug: string; is_required: boolean };

const WorkerJobs = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [tradesByJob, setTradesByJob] = useState<Record<string, JobTrade[]>>({});
  const [companies, setCompanies] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [showAll, setShowAll] = useState(false);
  const [badges, setBadges] = useState<WorkerBadge[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: wp } = await supabase
        .from("worker_profiles")
        .select("id, vetting_status")
        .eq("user_id", user.id)
        .maybeSingle();
      const isVerified = wp?.vetting_status === "verified" || wp?.vetting_status === "verified_pro";
      if (cancelled) return;
      setVerified(isVerified);
      if (!isVerified || !wp) {
        setLoading(false);
        return;
      }

      // Worker's active badges (used to mark each card and to render filter chips).
      const { data: badgeData } = await sb
        .from("trade_badges")
        .select("trade_slug, status, expires_at")
        .eq("worker_profile_id", wp.id)
        .eq("status", "active");
      setBadges((badgeData ?? []) as WorkerBadge[]);

      const fromTable = showAll ? "jobs" : "worker_visible_jobs";
      const { data: jobsData } = await sb
        .from(fromTable)
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      const jobsList = ((jobsData ?? []) as Job[]);
      setJobs(jobsList);

      const jobIds = jobsList.map((j) => j.id);
      if (jobIds.length > 0) {
        const { data: jt } = await sb
          .from("job_trades")
          .select("job_id, trade_slug, is_required")
          .in("job_id", jobIds);
        const map: Record<string, JobTrade[]> = {};
        ((jt ?? []) as JobTrade[]).forEach((row) => {
          (map[row.job_id] ??= []).push(row);
        });
        setTradesByJob(map);
      } else {
        setTradesByJob({});
      }

      const hpIds = Array.from(new Set(jobsList.map((j) => j.hiring_party_id)));
      if (hpIds.length > 0) {
        const { data: hpData } = await supabase
          .from("hiring_party_profiles")
          .select("id, company_name")
          .in("id", hpIds);
        const map: Record<string, string> = {};
        (hpData ?? []).forEach((h) => (map[h.id] = h.company_name));
        setCompanies(map);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, showAll]);

  const myActiveSlugs = useMemo(
    () => new Set(badges.map((b) => b.trade_slug)),
    [badges],
  );

  const filtered = jobs.filter((j) => {
    if (category !== "all" && j.category !== category) return false;
    if (search && !`${j.title} ${j.description ?? ""} ${j.city ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <AppLayout role="worker" nav={workerNav}>
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }

  if (!verified) {
    return (
      <AppLayout role="worker" nav={workerNav}>
        <PageHeader eyebrow="Find work" title="Get verified to see jobs" description="Only verified workers can view and apply to jobs." />
        <Button asChild size="lg"><Link to="/work/verification">Start verification</Link></Button>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="worker" nav={workerNav}>
      <PageHeader
        eyebrow="Find work"
        title="Open jobs"
        description={`${filtered.length} job${filtered.length === 1 ? "" : "s"} in St. Louis area`}
      />

      {badges.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Your badges:</span>
          {badges.map((b) => (
            <Badge key={b.trade_slug} variant="secondary">
              {tradeTitles[b.trade_slug as TradeSlug] ?? b.trade_slug}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-[1fr_220px_auto] gap-3 mb-6 items-center">
        <Input placeholder="Search by title, description, or city…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {jobCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm whitespace-nowrap">
          <Switch
            checked={showAll}
            onCheckedChange={setShowAll}
            data-testid="show-all-toggle"
          />
          Show jobs I'm not qualified for
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No open jobs match" description="Check back soon — new jobs are posted daily." />
      ) : (
        <div className="grid gap-4">
          {filtered.map((j) => {
            const reqRows = (tradesByJob[j.id] ?? []).map((t) => ({ trade_slug: t.trade_slug, is_required: t.is_required }));
            const mode: "any" | "all" = j.qualification_mode ?? "any";
            const q = qualifiesForJob({ requiredTrades: reqRows, mode, workerBadges: badges });
            const locked = !q.qualifies && reqRows.some((t) => t.is_required);
            const requiredSlugs = reqRows.filter((t) => t.is_required).map((t) => t.trade_slug);
            return (
              <Link
                key={j.id}
                to={locked ? `/work/quizzes/${q.missingTrades[0]}` : `/work/jobs/${j.id}`}
                data-testid={locked ? "locked-job" : "qualified-job"}
                className={`rounded-lg border p-5 transition-all ${locked ? "border-dashed border-border bg-muted/30 opacity-80 hover:border-primary/30" : "border-border bg-card hover:border-primary/50 hover:shadow-[var(--shadow-card)]"}`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="display-md text-lg flex items-center gap-2">
                      {locked && <Lock className="h-4 w-4 text-muted-foreground" aria-label="Locked" />}
                      {j.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{companies[j.hiring_party_id] ?? "Hiring party"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="display-md text-xl text-primary">${j.budget_amount}</div>
                    <div className="text-xs text-muted-foreground">{j.budget_type === "hourly" ? "per hour" : "flat"}</div>
                  </div>
                </div>
                {j.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{j.description}</p>}
                {requiredSlugs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {requiredSlugs.map((slug) => {
                      const have = myActiveSlugs.has(slug);
                      return (
                        <span
                          key={slug}
                          className={`px-2 py-0.5 rounded text-xs font-medium ${have ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                        >
                          {tradeTitles[slug as TradeSlug] ?? slug}
                        </span>
                      );
                    })}
                  </div>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground items-center">
                  {j.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {j.city}</span>}
                  {j.date_needed && <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {format(new Date(j.date_needed), "MMM d")}</span>}
                  {j.start_time && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {j.start_time.slice(0, 5)}</span>}
                  {j.workers_needed > 1 && <span>· {j.workers_needed} workers</span>}
                  {j.category && <span className="px-1.5 py-0.5 rounded bg-muted">{j.category}</span>}
                  {locked ? (
                    <span className="ml-auto inline-flex items-center gap-1 font-medium text-foreground">
                      <Lock className="h-3.5 w-3.5" /> Need: {tradeTitles[q.missingTrades[0] as TradeSlug] ?? q.missingTrades[0]} — Pass quiz to unlock
                    </span>
                  ) : requiredSlugs.length > 0 ? (
                    <span className="ml-auto inline-flex items-center gap-1 font-medium text-primary">
                      <CheckCircle2 className="h-3.5 w-3.5" /> You qualify
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default WorkerJobs;
