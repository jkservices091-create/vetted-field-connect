import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { hirerNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, PlusCircle, Users } from "lucide-react";
import { JobStatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";

const HirerJobs = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [hpId, setHpId] = useState<string | null>(null);
  const [appCounts, setAppCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: hp } = await supabase
        .from("hiring_party_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!hp) { setLoading(false); return; }
      setHpId(hp.id);
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("*")
        .eq("hiring_party_id", hp.id)
        .order("created_at", { ascending: false });
      setJobs(jobsData ?? []);

      if (jobsData && jobsData.length > 0) {
        const { data: apps } = await supabase
          .from("job_applications")
          .select("job_id")
          .in("job_id", jobsData.map((j) => j.id))
          .eq("status", "submitted");
        const counts: Record<string, number> = {};
        (apps ?? []).forEach((a) => { counts[a.job_id] = (counts[a.job_id] ?? 0) + 1; });
        setAppCounts(counts);
      }
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <AppLayout role="hiring_party" nav={hirerNav}>
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }

  if (!hpId) {
    return (
      <AppLayout role="hiring_party" nav={hirerNav}>
        <PageHeader eyebrow="Jobs" title="Set up your company first" />
        <Button asChild><Link to="/hire/profile">Set up</Link></Button>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="hiring_party" nav={hirerNav}>
      <PageHeader
        eyebrow="My jobs"
        title="Your job posts"
        description={`${jobs.length} total`}
        actions={<Button asChild size="lg"><Link to="/hire/jobs/new"><PlusCircle className="mr-1" /> Post a job</Link></Button>}
      />

      {jobs.length === 0 ? (
        <EmptyState
          title="No jobs yet"
          description="Post your first labor job and start getting bids from vetted workers."
          action={<Button asChild size="lg"><Link to="/hire/jobs/new">Post your first job</Link></Button>}
        />
      ) : (
        <div className="grid gap-3">
          {jobs.map((j) => (
            <Link key={j.id} to={`/hire/jobs/${j.id}`} className="rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-all">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="font-bold">{j.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {j.date_needed ? format(new Date(j.date_needed), "MMM d, yyyy") : "Date TBD"}
                    {j.city && ` · ${j.city}`}
                    {` · $${j.budget_amount} ${j.budget_type === "hourly" ? "/hr" : "flat"}`}
                  </p>
                </div>
                <JobStatusBadge status={j.status} />
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {appCounts[j.id] ?? 0} new bid{(appCounts[j.id] ?? 0) === 1 ? "" : "s"}</span>
                <span className="text-xs">· posted {format(new Date(j.created_at), "MMM d")}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default HirerJobs;
