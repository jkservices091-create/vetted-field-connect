import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { workerNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { TrustBadge } from "@/components/TrustBadge";
import { Loader2, Plus, Trash2, Upload, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { uploadToBucket } from "@/lib/storage";
import { toast } from "sonner";

type Reference = { name: string; phone: string; relationship: string; company: string };

const SITUATIONAL_QUESTIONS: { id: string; q: string }[] = [
  { id: "show_up", q: "It's 6:00 AM and pouring rain. Your job starts at 7:00. What do you do?" },
  { id: "mistake", q: "You break a tool on the jobsite by accident. How do you handle it?" },
  { id: "conflict", q: "Another worker is slacking and the foreman didn't notice. What do you do?" },
];

const Verification = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [workerProfile, setWorkerProfile] = useState<{ id: string; vetting_status: string } | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<any>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idDocPath, setIdDocPath] = useState<string | null>(null);
  const [refs, setRefs] = useState<Reference[]>([{ name: "", phone: "", relationship: "", company: "" }]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [bgConsent, setBgConsent] = useState(false);
  const [terms, setTerms] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: wp } = await supabase
        .from("worker_profiles")
        .select("id, vetting_status")
        .eq("user_id", user.id)
        .maybeSingle();
      setWorkerProfile(wp);
      if (wp) {
        const [{ data: sub }, { data: existingRefs }] = await Promise.all([
          supabase.from("verification_submissions").select("*").eq("worker_profile_id", wp.id).order("submitted_at", { ascending: false }).limit(1).maybeSingle(),
          supabase.from("worker_references").select("*").eq("worker_profile_id", wp.id),
        ]);
        if (sub) {
          setExistingSubmission(sub);
          setIdDocPath(sub.id_doc_url);
          setResponses((sub.situational_test_responses as Record<string, string>) ?? {});
          setBgConsent(sub.background_check_consent);
          setTerms(sub.terms_accepted);
        }
        if (existingRefs && existingRefs.length > 0) {
          setRefs(existingRefs.map((r: any) => ({ name: r.name, phone: r.phone, relationship: r.relationship ?? "", company: r.company ?? "" })));
        }
      }
      setLoading(false);
    })();
  }, [user]);

  const addRef = () => setRefs((r) => [...r, { name: "", phone: "", relationship: "", company: "" }]);
  const removeRef = (i: number) => setRefs((r) => r.filter((_, idx) => idx !== i));
  const updateRef = (i: number, k: keyof Reference, v: string) =>
    setRefs((r) => r.map((ref, idx) => (idx === i ? { ...ref, [k]: v } : ref)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !workerProfile) return;

    // Validate
    if (!idFile && !idDocPath) return toast.error("Upload a photo of your ID.");
    const validRefs = refs.filter((r) => r.name.trim() && r.phone.trim());
    if (validRefs.length < 2) return toast.error("Add at least 2 references with name and phone.");
    for (const q of SITUATIONAL_QUESTIONS) {
      if (!responses[q.id]?.trim() || responses[q.id].trim().length < 20) {
        return toast.error("Answer each question with at least a sentence.");
      }
    }
    if (!bgConsent) return toast.error("You must consent to the background check.");
    if (!terms) return toast.error("You must accept the worker terms.");

    setSubmitting(true);
    try {
      let finalIdPath = idDocPath;
      if (idFile) {
        const result = await uploadToBucket("verification-docs", user.id, idFile, "id");
        if ("error" in result) {
          toast.error("Upload failed: " + result.error);
          setSubmitting(false);
          return;
        }
        finalIdPath = result.path;
      }

      // Replace references
      await supabase.from("worker_references").delete().eq("worker_profile_id", workerProfile.id);
      const { error: refErr } = await supabase
        .from("worker_references")
        .insert(validRefs.map((r) => ({ ...r, worker_profile_id: workerProfile.id })));
      if (refErr) throw refErr;

      // Upsert submission
      const payload = {
        worker_profile_id: workerProfile.id,
        id_doc_url: finalIdPath,
        situational_test_responses: responses,
        background_check_consent: bgConsent,
        terms_accepted: terms,
        decision: "pending" as const,
        submitted_at: new Date().toISOString(),
      };
      const { error: subErr } = existingSubmission
        ? await supabase.from("verification_submissions").update(payload).eq("id", existingSubmission.id)
        : await supabase.from("verification_submissions").insert(payload);
      if (subErr) throw subErr;

      // Move worker to pending_review
      const { error: wpErr } = await supabase
        .from("worker_profiles")
        .update({ vetting_status: "pending_review" })
        .eq("id", workerProfile.id);
      if (wpErr) throw wpErr;

      toast.success("Submitted! Our team will review within 24 hours.");
      navigate("/work");
    } catch (err: any) {
      toast.error(err.message ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout role="worker" nav={workerNav}>
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }

  if (!workerProfile) {
    return (
      <AppLayout role="worker" nav={workerNav}>
        <PageHeader eyebrow="Verification" title="Build your profile first" />
        <Button onClick={() => navigate("/work/profile")}>Go to profile</Button>
      </AppLayout>
    );
  }

  const isLocked = workerProfile.vetting_status === "verified" || workerProfile.vetting_status === "verified_pro";
  const isPending = workerProfile.vetting_status === "pending_review";

  return (
    <AppLayout role="worker" nav={workerNav}>
      <PageHeader
        eyebrow="Vetting intake"
        title="Get verified"
        description="A few minutes here unlocks every job on the platform. Be honest — we call references."
      />

      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Current status:</span>
        <TrustBadge status={workerProfile.vetting_status as any} />
      </div>

      {isLocked && (
        <div className="rounded-lg border border-success/30 bg-success/10 p-5 mb-6 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-success mt-0.5" />
          <div>
            <p className="font-bold">You're verified.</p>
            <p className="text-sm text-muted-foreground">No further action needed. Browse jobs and start applying.</p>
          </div>
        </div>
      )}

      {isPending && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-5 mb-6">
          <p className="font-bold">Application under review</p>
          <p className="text-sm text-muted-foreground mt-1">We'll get back to you within 24 hours. You can update your answers below if needed.</p>
        </div>
      )}

      {existingSubmission?.decision === "rejected" && existingSubmission.admin_feedback && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-5 mb-6">
          <p className="font-bold">Application not approved</p>
          <p className="text-sm mt-1">{existingSubmission.admin_feedback}</p>
        </div>
      )}

      {existingSubmission?.decision === "needs_more_info" && existingSubmission.admin_feedback && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-5 mb-6">
          <p className="font-bold">More info needed</p>
          <p className="text-sm mt-1">{existingSubmission.admin_feedback}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-8 max-w-2xl">
        {/* Step 1 — ID */}
        <Section number={1} title="Photo ID" description="Driver's license or state ID. Used only for verification.">
          {idDocPath && !idFile && (
            <p className="text-sm text-muted-foreground">✓ ID on file. Upload a new one to replace.</p>
          )}
          <div className="flex items-center gap-3">
            <Input
              id="id-file"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setIdFile(e.target.files?.[0] ?? null)}
              disabled={isLocked}
            />
            {idFile && <span className="text-sm text-muted-foreground"><Upload className="inline h-4 w-4" /> {idFile.name}</span>}
          </div>
        </Section>

        {/* Step 2 — References */}
        <Section number={2} title="References" description="At least 2. Past employer, foreman, or someone you've crewed with.">
          <div className="space-y-4">
            {refs.map((r, i) => (
              <div key={i} className="rounded-md border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Reference {i + 1}</span>
                  {refs.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeRef(i)} disabled={isLocked}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Name *</Label>
                    <Input value={r.name} onChange={(e) => updateRef(i, "name", e.target.value)} placeholder="Tony Reyes" disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone *</Label>
                    <Input value={r.phone} onChange={(e) => updateRef(i, "phone", e.target.value)} placeholder="(314) 555-0119" disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Relationship</Label>
                    <Input value={r.relationship} onChange={(e) => updateRef(i, "relationship", e.target.value)} placeholder="Foreman" disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Company</Label>
                    <Input value={r.company} onChange={(e) => updateRef(i, "company", e.target.value)} placeholder="Reyes Landscape" disabled={isLocked} />
                  </div>
                </div>
              </div>
            ))}
            {!isLocked && (
              <Button type="button" variant="outline" size="sm" onClick={addRef}>
                <Plus className="h-4 w-4 mr-1" /> Add another
              </Button>
            )}
          </div>
        </Section>

        {/* Step 3 — Situational */}
        <Section number={3} title="Quick scenarios" description="Short answers. We're checking judgment, not grammar.">
          <div className="space-y-4">
            {SITUATIONAL_QUESTIONS.map((q) => (
              <div key={q.id} className="space-y-1.5">
                <Label>{q.q}</Label>
                <Textarea
                  rows={3}
                  value={responses[q.id] ?? ""}
                  onChange={(e) => setResponses((r) => ({ ...r, [q.id]: e.target.value }))}
                  disabled={isLocked}
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Step 4 — Consent */}
        <Section number={4} title="Consent & terms">
          <div className="space-y-3">
            <label className="flex items-start gap-3 rounded-md border border-border bg-card p-4 cursor-pointer">
              <Checkbox checked={bgConsent} onCheckedChange={(v) => setBgConsent(!!v)} disabled={isLocked} className="mt-0.5" />
              <span className="text-sm">
                I consent to a background check. FieldHands may run a basic criminal record and identity verification.
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-md border border-border bg-card p-4 cursor-pointer">
              <Checkbox checked={terms} onCheckedChange={(v) => setTerms(!!v)} disabled={isLocked} className="mt-0.5" />
              <span className="text-sm">
                I agree to the FieldHands worker terms: show up on time, do honest work, and treat hirers with respect. No-shows lead to removal.
              </span>
            </label>
          </div>
        </Section>

        {!isLocked && (
          <div className="flex items-center gap-3">
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {existingSubmission ? "Resubmit application" : "Submit for review"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/work")}>Cancel</Button>
          </div>
        )}
      </form>
    </AppLayout>
  );
};

function Section({ number, title, description, children }: { number: number; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline gap-3">
        <span className="display-md text-primary">0{number}</span>
        <div>
          <h2 className="display-md text-xl">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}

export default Verification;
