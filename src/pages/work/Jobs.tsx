import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { workerNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, MapPin, DollarSign, Calendar, Clock } from "lucide-react";
import { jobCategories } from "@/lib/labels";
import { format } from "date-fns";

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
};

const WorkerJobs = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: wp } = await supabase
        .from("worker_profiles")
        .select("vetting_status")
        .eq("user_id", user.id)
        .maybeSingle();
      const isVerified = wp?.vetting_status === "verified" || wp?.vetting_status === "verified_pro";
      setVerified(isVerified);
      if (isVerified) {
        const { data: jobsData } = await supabase
          .from("jobs")
          .select("*")
          .eq("status", "open")
          .order("created_at", { ascending: false });
        setJobs((jobsData ?? []) as Job[]);
        const hpIds = Array.from(new Set((jobsData ?? []).map((j) => j.hiring_party_id)));
        if (hpIds.length > 0) {
          const { data: hpData } = await supabase
            .from("hiring_party_profiles")
            .select("id, company_name")
            .in("id", hpIds);
          const map: Record<string, string> = {};
          (hpData ?? []).forEach((h) => (map[h.id] = h.company_name));
          setCompanies(map);
        }
      }
      setLoading(false);
    })();
  }, [user]);

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

  const filtered = jobs.filter((j) => {
    if (category !== "all" && j.category !== category) return false;
    if (search && !`${j.title} ${j.description ?? ""} ${j.city ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AppLayout role="worker" nav={workerNav}>
      <PageHeader eyebrow="Find work" title="Open jobs" description={`${filtered.length} job${filtered.length === 1 ? "" : "s"} in St. Louis area`} />

      <div className="grid sm:grid-cols-[1fr_220px] gap-3 mb-6">
        <Input placeholder="Search by title, description, or city…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {jobCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No open jobs match" description="Check back soon — new jobs are posted daily." />
      ) : (
        <div className="grid gap-4">
          {filtered.map((j) => (
            <Link key={j.id} to={`/work/jobs/${j.id}`} className="rounded-lg border border-border bg-card p-5 hover:border-primary/50 hover:shadow-[var(--shadow-card)] transition-all">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="display-md text-lg">{j.title}</h3>
                  <p className="text-sm text-muted-foreground">{companies[j.hiring_party_id] ?? "Hiring party"}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="display-md text-xl text-primary">${j.budget_amount}</div>
                  <div className="text-xs text-muted-foreground">{j.budget_type === "hourly" ? "per hour" : "flat"}</div>
                </div>
              </div>
              {j.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{j.description}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                {j.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {j.city}</span>}
                {j.date_needed && <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {format(new Date(j.date_needed), "MMM d")}</span>}
                {j.start_time && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {j.start_time.slice(0, 5)}</span>}
                {j.workers_needed > 1 && <span>· {j.workers_needed} workers</span>}
                {j.category && <span className="px-1.5 py-0.5 rounded bg-muted">{j.category}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default WorkerJobs;
