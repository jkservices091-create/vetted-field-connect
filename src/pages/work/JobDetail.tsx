import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { workerNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, MapPin, Calendar, Clock, Users, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ApplicationStatusBadge } from "@/components/StatusBadge";

const WorkerJobDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [workerProfileId, setWorkerProfileId] = useState<string | null>(null);
  const [existingApp, setExistingApp] = useState<any>(null);
  const [proposedAmount, setProposedAmount] = useState("");
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const [{ data: jobData }, { data: wp }] = await Promise.all([
        supabase.from("jobs").select("*").eq("id", id).maybeSingle(),
        supabase.from("worker_profiles").select("id, vetting_status").eq("user_id", user.id).maybeSingle(),
      ]);
      if (!jobData) {
        setLoading(false);
        return;
      }
      setJob(jobData);
      setProposedAmount(String(jobData.budget_amount));
      const { data: hp } = await supabase
        .from("hiring_party_profiles")
        .select("company_name, company_type, about")
        .eq("id", jobData.hiring_party_id)
        .maybeSingle();
      setCompany(hp);

      if (wp) {
        setWorkerProfileId(wp.id);
        const { data: app } = await supabase
          .from("job_applications")
          .select("*")
          .eq("job_id", id)
          .eq("worker_profile_id", wp.id)
          .maybeSingle();
        if (app) {
          setExistingApp(app);
          setProposedAmount(String(app.proposed_amount));
          setMessage(app.message ?? "");
          setConfirmed(app.availability_confirmed);
        }
      }
      setLoading(false);
    })();
  }, [id, user]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerProfileId || !job) return;
    const amt = parseFloat(proposedAmount);
    if (isNaN(amt) || amt <= 0) return toast.error("Enter a valid bid amount.");
    if (!confirmed) return toast.error("Confirm you're available for this job.");
    setSubmitting(true);
    const payload = {
      job_id: job.id,
      worker_profile_id: workerProfileId,
      proposed_amount: amt,
      message: message.trim() || null,
      availability_confirmed: confirmed,
      status: "submitted" as const,
    };
    const { error } = existingApp
      ? await supabase.from("job_applications").update(payload).eq("id", existingApp.id)
      : await supabase.from("job_applications").insert(payload);
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success(existingApp ? "Bid updated." : "Bid submitted!");
    navigate("/work/bookings");
  };

  const handleWithdraw = async () => {
    if (!existingApp) return;
    const { error } = await supabase.from("job_applications").update({ status: "withdrawn" }).eq("id", existingApp.id);
    if (error) return toast.error(error.message);
    toast.success("Bid withdrawn.");
    navigate("/work/bookings");
  };

  if (loading) {
    return (
      <AppLayout role="worker" nav={workerNav}>
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }
  if (!job) {
    return (
      <AppLayout role="worker" nav={workerNav}>
        <PageHeader eyebrow="Job" title="Job not found" />
        <Button asChild><Link to="/work/jobs">Back to jobs</Link></Button>
      </AppLayout>
    );
  }

  const canApply = job.status === "open" && (!existingApp || existingApp.status === "withdrawn");
  const isReadOnlyApp = existingApp && existingApp.status !== "submitted" && existingApp.status !== "withdrawn";

  return (
    <AppLayout role="worker" nav={workerNav}>
      <Link to="/work/jobs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> All jobs
      </Link>
      <PageHeader eyebrow={job.category ?? "Labor"} title={job.title} description={company?.company_name ?? ""} />

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              {job.city && <Detail icon={MapPin} label="Location" value={job.city + (job.address ? ` · ${job.address}` : "")} />}
              {job.date_needed && <Detail icon={Calendar} label="Date needed" value={format(new Date(job.date_needed), "EEE, MMM d, yyyy")} />}
              {job.start_time && <Detail icon={Clock} label="Start time" value={job.start_time.slice(0, 5)} />}
              <Detail icon={Users} label="Workers needed" value={String(job.workers_needed)} />
              {job.estimated_duration_hours && <Detail icon={Clock} label="Estimated duration" value={`${job.estimated_duration_hours} hrs`} />}
            </div>
          </div>

          {job.description && (
            <div>
              <h2 className="display-md text-lg mb-2">Job description</h2>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{job.description}</p>
            </div>
          )}

          {job.required_skills && job.required_skills.length > 0 && (
            <div>
              <h2 className="display-md text-lg mb-2">Skills required</h2>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.map((s: string) => (
                  <span key={s} className="px-2 py-1 rounded-md bg-muted text-xs font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}

          {company && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="display-md text-lg mb-2">About {company.company_name}</h2>
              {company.company_type && <p className="text-sm text-muted-foreground mb-2">{company.company_type}</p>}
              {company.about && <p className="text-sm">{company.about}</p>}
            </div>
          )}
        </div>

        {/* Bid panel */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="display-md text-3xl text-primary">${job.budget_amount}</span>
              <span className="text-sm text-muted-foreground">{job.budget_type === "hourly" ? "/ hr posted" : "flat posted"}</span>
            </div>

            {existingApp && (
              <div className="my-4 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Your bid:</span>
                <ApplicationStatusBadge status={existingApp.status} />
              </div>
            )}

            {isReadOnlyApp ? (
              <div className="mt-4 space-y-2 text-sm">
                <p><strong>Proposed:</strong> ${existingApp.proposed_amount}</p>
                {existingApp.message && <p className="text-muted-foreground">{existingApp.message}</p>}
              </div>
            ) : canApply ? (
              <form onSubmit={handleApply} className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label>Your bid ({job.budget_type === "hourly" ? "$/hr" : "$ flat"}) *</Label>
                  <Input type="number" step="0.01" min="0" value={proposedAmount} onChange={(e) => setProposedAmount(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Message to hirer</Label>
                  <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Why you're a good fit, relevant experience, anything they should know." />
                </div>
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(!!v)} className="mt-0.5" />
                  <span>I'm available {job.date_needed ? format(new Date(job.date_needed), "EEE MMM d") : "on the date needed"} and will show up on time.</span>
                </label>
                <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {existingApp ? "Update bid" : "Submit bid"}
                </Button>
                {existingApp && existingApp.status === "submitted" && (
                  <Button type="button" variant="outline" className="w-full" onClick={handleWithdraw}>Withdraw</Button>
                )}
              </form>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">This job is no longer accepting bids.</p>
            )}
          </div>
        </aside>
      </div>
    </AppLayout>
  );
};

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

export default WorkerJobDetail;
