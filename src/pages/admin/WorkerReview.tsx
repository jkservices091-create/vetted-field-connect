import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { adminNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { getSignedUrl } from "@/lib/storage";
import { toast } from "sonner";
import { Loader2, ArrowLeft, FileText, ExternalLink, ShieldCheck, ShieldX, MessageCircleWarning, Check, X, Image as ImageIcon } from "lucide-react";
import { TrustBadge } from "@/components/TrustBadge";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { TRADES } from "@/lib/badges";
import { useAuth } from "@/hooks/useAuth";

type TradeRefRow = {
  id: string;
  trade_slug: string;
  job_completion_date: string;
  verified_at: string | null;
  worker_reference_id: string;
  worker_references?: { name: string } | null;
};

type TradePhotoRow = {
  id: string;
  trade_slug: string;
  storage_path: string;
  caption: string | null;
  reviewed_at: string | null;
};

const WorkerReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [refs, setRefs] = useState<any[]>([]);
  const [tradeRefs, setTradeRefs] = useState<TradeRefRow[]>([]);
  const [tradePhotos, setTradePhotos] = useState<TradePhotoRow[]>([]);
  const [idDocUrl, setIdDocUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [acting, setActing] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data: wp } = await supabase.from("worker_profiles").select("*").eq("id", id).maybeSingle();
    if (!wp) { setLoading(false); return; }
    setWorker(wp);
    const [{ data: prof }, { data: sub }, { data: refsData }, trRes, phRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", wp.user_id).maybeSingle(),
      supabase.from("verification_submissions").select("*").eq("worker_profile_id", wp.id).order("submitted_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("worker_references").select("*").eq("worker_profile_id", wp.id),
      db
        .from("trade_references")
        .select("id, trade_slug, job_completion_date, verified_at, worker_reference_id, worker_references!inner(name, worker_profile_id)")
        .eq("worker_references.worker_profile_id", wp.id),
      db
        .from("trade_project_photos")
        .select("*")
        .eq("worker_profile_id", wp.id)
        .order("created_at", { ascending: false }),
    ]);
    setProfile(prof);
    setSubmission(sub);
    setRefs(refsData ?? []);
    setTradeRefs(trRes.data ?? []);
    setTradePhotos(phRes.data ?? []);
    if (sub?.id_doc_url) {
      const signed = await getSignedUrl("verification-docs", sub.id_doc_url, 600);
      setIdDocUrl(signed);
    }
    setLoading(false);
  };

  const verifyTradeRef = async (tradeRefId: string, verify: boolean) => {
    if (!user) return;
    const payload = verify
      ? { verified_at: new Date().toISOString(), verified_by: user.id }
      : { verified_at: null, verified_by: null };
    const { error } = await db.from("trade_references").update(payload).eq("id", tradeRefId);
    if (error) return toast.error(error.message);
    toast.success(verify ? "Reference verified." : "Verification cleared.");
    load();
  };

  const reviewTradePhoto = async (photoId: string, review: boolean) => {
    if (!user) return;
    const payload = review
      ? { reviewed_at: new Date().toISOString(), reviewed_by: user.id }
      : { reviewed_at: null, reviewed_by: null };
    const { error } = await db.from("trade_project_photos").update(payload).eq("id", photoId);
    if (error) return toast.error(error.message);
    toast.success(review ? "Photo approved." : "Photo unapproved.");
    load();
  };

  useEffect(() => { load(); }, [id]);

  const decide = async (decision: "approved" | "rejected" | "needs_more_info") => {
    if (!submission || !worker) return;
    if (decision === "rejected" && !feedback.trim()) return toast.error("Add feedback when rejecting.");
    if (decision === "needs_more_info" && !feedback.trim()) return toast.error("Tell them what's needed.");

    setActing(true);
    const newStatus = decision === "approved" ? "verified" : decision === "rejected" ? "rejected" : "applicant";
    const { error: subErr } = await supabase
      .from("verification_submissions")
      .update({
        decision,
        admin_feedback: feedback.trim() || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", submission.id);
    if (subErr) { setActing(false); return toast.error(subErr.message); }

    const { error: wpErr } = await supabase
      .from("worker_profiles")
      .update({ vetting_status: newStatus })
      .eq("id", worker.id);
    if (wpErr) { setActing(false); return toast.error(wpErr.message); }

    setActing(false);
    toast.success(decision === "approved" ? "Worker verified." : decision === "rejected" ? "Application rejected." : "Sent back for more info.");
    navigate("/admin/queue");
  };

  if (loading) {
    return (
      <AppLayout role="admin" nav={adminNav}>
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }
  if (!worker) {
    return (
      <AppLayout role="admin" nav={adminNav}>
        <PageHeader eyebrow="Worker" title="Worker not found" />
        <Button asChild><Link to="/admin/queue">Back</Link></Button>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="admin" nav={adminNav}>
      <Link to="/admin/queue" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Vetting queue
      </Link>
      <PageHeader
        eyebrow="Worker review"
        title={profile?.full_name ?? "Unnamed worker"}
        description=""
        actions={<TrustBadge status={worker.vetting_status} />}
      />

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-6">
          {/* Profile snapshot */}
          <Section title="Profile">
            <Grid>
              <KV label="City" value={worker.city ?? "—"} />
              <KV label="Service radius" value={`${worker.service_radius_miles ?? 25} mi`} />
              <KV label="Transportation" value={worker.transportation ?? "—"} />
              <KV label="Phone" value={profile?.phone ?? "—"} />
            </Grid>
            {worker.bio && <p className="text-sm mt-3 whitespace-pre-wrap">{worker.bio}</p>}
            {worker.skills && worker.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {worker.skills.map((s: string) => <span key={s} className="px-2 py-0.5 rounded bg-muted text-xs">{s}</span>)}
              </div>
            )}
          </Section>

          {/* ID */}
          <Section title="Photo ID">
            {idDocUrl ? (
              <a href={idDocUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                <FileText className="h-4 w-4" /> View ID document <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">No ID uploaded.</p>
            )}
          </Section>

          {/* References */}
          <Section title={`References (${refs.length})`}>
            {refs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No references provided.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {refs.map((r) => (
                  <div key={r.id} className="rounded-md border border-border bg-card p-3 text-sm">
                    <p className="font-bold">{r.name}</p>
                    <p className="text-muted-foreground">{r.phone}</p>
                    {(r.relationship || r.company) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {r.relationship}{r.relationship && r.company && " · "}{r.company}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Situational */}
          <Section title="Situational test">
            {submission?.situational_test_responses && Object.keys(submission.situational_test_responses).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(submission.situational_test_responses as Record<string, string>).map(([k, v]) => (
                  <div key={k} className="rounded-md bg-muted/40 border border-border p-3">
                    <p className="text-xs font-bold uppercase text-muted-foreground mb-1">{k.replace(/_/g, " ")}</p>
                    <p className="text-sm whitespace-pre-wrap">{v}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No responses.</p>
            )}
          </Section>

          {/* Trades — per-trade evidence */}
          <Section title={`Trades (${tradeRefs.length} refs · ${tradePhotos.length} photos)`}>
            {tradeRefs.length === 0 && tradePhotos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No trade evidence submitted yet.</p>
            ) : (
              <div className="space-y-5">
                {TRADES.filter(
                  (t) => tradeRefs.some((tr) => tr.trade_slug === t.slug) || tradePhotos.some((p) => p.trade_slug === t.slug),
                ).map((t) => {
                  const trs = tradeRefs.filter((tr) => tr.trade_slug === t.slug);
                  const phs = tradePhotos.filter((p) => p.trade_slug === t.slug);
                  return (
                    <div key={t.slug} className="rounded-md border border-border p-3">
                      <p className="font-semibold text-sm mb-2">{t.title}</p>
                      {trs.length > 0 && (
                        <div className="grid gap-1.5 mb-2">
                          {trs.map((tr) => (
                            <div key={tr.id} className="flex items-center justify-between text-sm rounded bg-muted/40 px-3 py-2">
                              <div>
                                <span className="font-medium">{tr.worker_references?.name ?? "Reference"}</span>
                                <span className="text-muted-foreground"> · job done {tr.job_completion_date}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {tr.verified_at ? <Badge>Verified</Badge> : <Badge variant="outline">Pending</Badge>}
                                {tr.verified_at ? (
                                  <Button size="sm" variant="ghost" onClick={() => verifyTradeRef(tr.id, false)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline" onClick={() => verifyTradeRef(tr.id, true)}>
                                    <Check className="h-4 w-4 mr-1" /> Verify
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {phs.length > 0 && (
                        <div className="grid gap-1.5">
                          {phs.map((p) => (
                            <div key={p.id} className="flex items-center justify-between text-sm rounded bg-muted/40 px-3 py-2">
                              <div className="flex items-center gap-2 truncate">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate">{p.caption || p.storage_path.split("/").pop()}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {p.reviewed_at ? <Badge>Reviewed</Badge> : <Badge variant="outline">Pending</Badge>}
                                {p.reviewed_at ? (
                                  <Button size="sm" variant="ghost" onClick={() => reviewTradePhoto(p.id, false)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline" onClick={() => reviewTradePhoto(p.id, true)}>
                                    <Check className="h-4 w-4 mr-1" /> Approve
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Submission meta */}
          {submission && (
            <Section title="Submission">
              <Grid>
                <KV label="Submitted" value={format(new Date(submission.submitted_at), "MMM d, yyyy h:mm a")} />
                <KV label="Background check consent" value={submission.background_check_consent ? "Yes" : "No"} />
                <KV label="Terms accepted" value={submission.terms_accepted ? "Yes" : "No"} />
                <KV label="Current decision" value={submission.decision} />
              </Grid>
            </Section>
          )}
        </div>

        {/* Decision panel */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h3 className="display-md text-lg">Decision</h3>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Feedback (required for reject / more-info)</label>
              <Textarea rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="What needs to change…" />
            </div>
            <div className="grid gap-2">
              <Button onClick={() => decide("approved")} disabled={acting} className="bg-success hover:bg-success/90 text-success-foreground">
                <ShieldCheck className="mr-1 h-4 w-4" /> Approve & verify
              </Button>
              <Button onClick={() => decide("needs_more_info")} disabled={acting} variant="outline">
                <MessageCircleWarning className="mr-1 h-4 w-4" /> Request more info
              </Button>
              <Button onClick={() => decide("rejected")} disabled={acting} variant="destructive">
                <ShieldX className="mr-1 h-4 w-4" /> Reject
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </AppLayout>
  );
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="display-md text-lg mb-3">{title}</h2>
      <div className="rounded-lg border border-border bg-card p-5">{children}</div>
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) { return <div className="grid sm:grid-cols-2 gap-3">{children}</div>; }
function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

export default WorkerReview;
