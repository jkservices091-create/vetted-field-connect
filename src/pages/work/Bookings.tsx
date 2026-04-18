import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { workerNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { ApplicationStatusBadge, JobStatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";

const Bookings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: wp } = await supabase
        .from("worker_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!wp) { setLoading(false); return; }
      const { data } = await supabase
        .from("job_applications")
        .select("*, jobs(*)")
        .eq("worker_profile_id", wp.id)
        .order("created_at", { ascending: false });
      setApps(data ?? []);
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

  return (
    <AppLayout role="worker" nav={workerNav}>
      <PageHeader eyebrow="My bookings" title="Your bids & jobs" description="Bids you've submitted and jobs you've been booked for." />
      {apps.length === 0 ? (
        <EmptyState
          title="No bids yet"
          description="Browse open jobs and submit your first bid."
          action={<Button asChild><Link to="/work/jobs">Find work</Link></Button>}
        />
      ) : (
        <div className="grid gap-3">
          {apps.map((a) => (
            <Link key={a.id} to={`/work/jobs/${a.job_id}`} className="rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-all">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="font-bold">{a.jobs?.title ?? "Job"}</h3>
                  <p className="text-xs text-muted-foreground">
                    {a.jobs?.date_needed ? format(new Date(a.jobs.date_needed), "MMM d, yyyy") : "Date TBD"}
                    {a.jobs?.city && ` · ${a.jobs.city}`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <ApplicationStatusBadge status={a.status} />
                  {a.jobs?.status && <JobStatusBadge status={a.jobs.status} />}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your bid: <span className="font-semibold text-foreground">${a.proposed_amount}</span></span>
                <span className="text-xs text-muted-foreground">{format(new Date(a.created_at), "MMM d")}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Bookings;
