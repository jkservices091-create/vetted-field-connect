import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { hirerNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, MapPin, Calendar, Clock, Users, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { JobStatusBadge, ApplicationStatusBadge } from "@/components/StatusBadge";
import { TrustBadge } from "@/components/TrustBadge";

const HirerJobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [workers, setWorkers] = useState<Record<string, any>>({});
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    const { data: jobData } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
    if (!jobData) { setLoading(false); return; }
    setJob(jobData);
    const { data: appsData } = await supabase
      .from("job_applications")
      .select("*")
      .eq("job_id", id)
      .order("created_at", { ascending: false });
    setApps(appsData ?? []);
    const wpIds = Array.from(new Set((appsData ?? []).map((a) => a.worker_profile_id)));
    if (wpIds.length > 0) {
      const { data: wpData } = await supabase
        .from("worker_profiles")
        .select("id, user_id, city, bio, skills, vetting_status, transportation, service_radius_miles")
        .in("id", wpIds);
      const userIds = (wpData ?? []).map((w) => w.user_id);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", userIds);
      const profMap: Record<string, any> = {};
      (profileData ?? []).forEach((p) => (profMap[p.user_id] = p));
      const map: Record<string, any> = {};
      (wpData ?? []).forEach((w) => (map[w.id] = { ...w, profile: profMap[w.user_id] }));
      setWorkers(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const acceptApplicant = async (app: any) => {
    if (!confirm(`Book ${workers[app.worker_profile_id]?.profile?.full_name ?? "this worker"} for $${app.proposed_amount}?`)) return;
    setActing(app.id);
    const { error: jErr } = await supabase
      .from("jobs")
      .update({ status: "in_progress", accepted_worker_id: app.worker_profile_id })
      .eq("id", job.id);
    if (jErr) { setActing(null); return toast.error(jErr.message); }
    const { error: aErr } = await supabase.from("job_applications").update({ status: "accepted" }).eq("id", app.id);
    if (aErr) { setActing(null); return toast.error(aErr.message); }
    // decline others
    const others = apps.filter((a) => a.id !== app.id && a.status === "submitted").map((a) => a.id);
    if (others.length > 0) {
      await supabase.from("job_applications").update({ status: "declined" }).in("id", others);
    }
    toast.success("Worker booked.");
    setActing(null);
    load();
  };

  const declineApplicant = async (app: any) => {
    setActing(app.id);
    const { error } = await supabase.from("job_applications").update({ status: "declined" }).eq("id", app.id);
    setActing(null);
    if (error) return toast.error(error.message);
    toast.success("Bid declined.");
    load();
  };

  const publishDraft = async () => {
    const { error } = await supabase.from("jobs").update({ status: "open" }).eq("id", job.id);
    if (error) return toast.error(error.message);
    toast.success("Job published.");
    load();
  };

  const closeJob = async () => {
    if (!confirm("Close this job to new bids?")) return;
    const { error } = await supabase.from("jobs").update({ status: "canceled" }).eq("id", job.id);
    if (error) return toast.error(error.message);
    toast.success("Job closed.");
    load();
  };

  const markComplete = async () => {
    if (!confirm("Mark job as completed? This unlocks reviews.")) return;
    const { error } = await supabase.from("jobs").update({ status: "completed" }).eq("id", job.id);
    if (error) return toast.error(error.message);
    toast.success("Job marked complete.");
    load();
  };

  if (loading) {
    return (
      <AppLayout role="hiring_party" nav={hirerNav}>
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }
  if (!job) {
    return (
      <AppLayout role="hiring_party" nav={hirerNav}>
        <PageHeader eyebrow="Job" title="Job not found" />
        <Button asChild><Link to="/hire/jobs">Back to jobs</Link></Button>
      </AppLayout>
    );
  }

  const submitted = apps.filter((a) => a.status === "submitted");
  const accepted = apps.find((a) => a.status === "accepted");

  return (
    <AppLayout role="hiring_party" nav={hirerNav}>
      <Link to="/hire/jobs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> All jobs
      </Link>
      <PageHeader
        eyebrow={job.category ?? "Labor"}
        title={job.title}
        description=""
        actions={
          <div className="flex gap-2 items-center">
            <JobStatusBadge status={job.status} />
            {job.status === "draft" && <Button onClick={publishDraft}>Publish</Button>}
            {job.status === "in_progress" && <Button onClick={markComplete}>Mark complete</Button>}
            {(job.status === "open" || job.status === "draft") && (
              <Button variant="outline" onClick={closeJob}>Close</Button>
            )}
          </div>
        }
      />

      <div className="rounded-lg border border-border bg-card p-5 mb-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <Detail icon={MapPin} label="Location" value={job.city + (job.address ? ` · ${job.address}` : "")} />
          {job.date_needed && <Detail icon={Calendar} label="Date" value={format(new Date(job.date_needed), "EEE, MMM d")} />}
          {job.start_time && <Detail icon={Clock} label="Start" value={job.start_time.slice(0, 5)} />}
          <Detail icon={Users} label="Budget" value={`$${job.budget_amount} ${job.budget_type === "hourly" ? "/hr" : "flat"}`} />
        </div>
        {job.description && <p className="text-sm whitespace-pre-wrap mt-4 pt-4 border-t border-border">{job.description}</p>}
      </div>

      {accepted && (
        <div className="mb-6">
          <h2 className="display-md text-lg mb-3">Booked worker</h2>
          <ApplicantCard app={accepted} worker={workers[accepted.worker_profile_id]} acting={acting} />
        </div>
      )}

      <h2 className="display-md text-lg mb-3">
        {submitted.length} new bid{submitted.length === 1 ? "" : "s"}
      </h2>

      {submitted.length === 0 && !accepted ? (
        <div className="rounded-lg border-2 border-dashed border-border bg-card/40 p-8 text-center">
          <p className="text-muted-foreground">No bids yet. Verified workers will see your job and submit bids soon.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submitted.map((a) => (
            <ApplicantCard
              key={a.id}
              app={a}
              worker={workers[a.worker_profile_id]}
              acting={acting}
              onAccept={() => acceptApplicant(a)}
              onDecline={() => declineApplicant(a)}
              canAct={job.status === "open" && !accepted}
            />
          ))}
          {apps.filter((a) => a.status === "declined" || a.status === "withdrawn").length > 0 && (
            <details className="mt-6">
              <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                Show {apps.filter((a) => a.status === "declined" || a.status === "withdrawn").length} other bid(s)
              </summary>
              <div className="space-y-3 mt-3">
                {apps.filter((a) => a.status === "declined" || a.status === "withdrawn").map((a) => (
                  <ApplicantCard key={a.id} app={a} worker={workers[a.worker_profile_id]} acting={acting} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </AppLayout>
  );
};

function ApplicantCard({ app, worker, acting, onAccept, onDecline, canAct }: { app: any; worker: any; acting: string | null; onAccept?: () => void; onDecline?: () => void; canAct?: boolean }) {
  if (!worker) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold">{worker.profile?.full_name ?? "Worker"}</h3>
            <TrustBadge status={worker.vetting_status} />
            <ApplicationStatusBadge status={app.status} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {worker.city ?? "—"} · {worker.transportation === "own_vehicle" ? "Own vehicle" : worker.transportation === "public_transit" ? "Transit" : "No transport"}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="display-md text-xl text-primary">${app.proposed_amount}</div>
          <div className="text-xs text-muted-foreground">their bid</div>
        </div>
      </div>

      {worker.bio && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{worker.bio}</p>}
      {worker.skills && worker.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {worker.skills.slice(0, 6).map((s: string) => (
            <span key={s} className="px-1.5 py-0.5 rounded bg-muted text-xs">{s}</span>
          ))}
        </div>
      )}
      {app.message && (
        <div className="rounded-md bg-muted/50 border border-border p-3 my-3 text-sm">
          <p className="text-xs uppercase text-muted-foreground font-semibold mb-1">Message</p>
          {app.message}
        </div>
      )}

      {canAct && onAccept && onDecline && (
        <div className="flex gap-2 pt-3 border-t border-border">
          <Button size="sm" onClick={onAccept} disabled={acting === app.id}>
            <CheckCircle2 className="mr-1 h-4 w-4" /> Book this worker
          </Button>
          <Button size="sm" variant="outline" onClick={onDecline} disabled={acting === app.id}>
            <XCircle className="mr-1 h-4 w-4" /> Decline
          </Button>
        </div>
      )}
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1 inline-flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

export default HirerJobDetail;
