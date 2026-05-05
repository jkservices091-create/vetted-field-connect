import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { workerNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { useAuth } from "@/hooks/useAuth";
import { uploadToBucket } from "@/lib/storage";
import { toast } from "sonner";
import { TRADES } from "@/lib/badges";
import { format } from "date-fns";

type Ref = { id: string; name: string };
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
  created_at: string;
};

const TradeEvidence = () => {
  const { slug = "" } = useParams();
  const trade = TRADES.find((t) => t.slug === slug);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refs, setRefs] = useState<Ref[]>([]);
  const [tradeRefs, setTradeRefs] = useState<TradeRefRow[]>([]);
  const [photos, setPhotos] = useState<TradePhotoRow[]>([]);

  // form state
  const [refId, setRefId] = useState<string>("");
  const [completionDate, setCompletionDate] = useState<string>("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");

  useEffect(() => {
    if (!user || !trade) return;
    (async () => {
      const { data: wp } = await supabase
        .from("worker_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!wp) {
        setLoading(false);
        return;
      }
      setWorkerId(wp.id);

      const [{ data: refsData }, trRes, phRes] = await Promise.all([
        supabase.from("worker_references").select("id, name").eq("worker_profile_id", wp.id),
        db
          .from("trade_references")
          .select("id, trade_slug, job_completion_date, verified_at, worker_reference_id, worker_references!inner(name, worker_profile_id)")
          .eq("trade_slug", trade.slug)
          .eq("worker_references.worker_profile_id", wp.id),
        db
          .from("trade_project_photos")
          .select("*")
          .eq("worker_profile_id", wp.id)
          .eq("trade_slug", trade.slug)
          .order("created_at", { ascending: false }),
      ]);
      setRefs(refsData ?? []);
      setTradeRefs(trRes.data ?? []);
      setPhotos(phRes.data ?? []);
      setLoading(false);
    })();
  }, [user, trade]);

  if (!trade) {
    return (
      <AppLayout role="worker" nav={workerNav}>
        <PageHeader eyebrow="Evidence" title="Trade not found" />
        <Button asChild>
          <Link to="/work/badges">Back to badges</Link>
        </Button>
      </AppLayout>
    );
  }

  const tagReference = async () => {
    if (!refId || !completionDate || !workerId) {
      toast.error("Pick a reference and a job completion date.");
      return;
    }
    setSubmitting(true);
    const { error } = await db.from("trade_references").insert({
      worker_reference_id: refId,
      trade_slug: trade.slug,
      job_completion_date: completionDate,
    });
    setSubmitting(false);
    if (error) {
      if ((error.message || "").includes("duplicate")) {
        toast.error("This reference is already tagged for this trade.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Reference tagged. Awaiting admin verification.");
    setRefId("");
    setCompletionDate("");
    // reload list
    const trRes = await db
      .from("trade_references")
      .select("id, trade_slug, job_completion_date, verified_at, worker_reference_id, worker_references!inner(name, worker_profile_id)")
      .eq("trade_slug", trade.slug)
      .eq("worker_references.worker_profile_id", workerId);
    setTradeRefs(trRes.data ?? []);
  };

  const removeTradeRef = async (id: string) => {
    const { error } = await db.from("trade_references").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setTradeRefs((rs) => rs.filter((r) => r.id !== id));
  };

  const uploadPhotos = async () => {
    if (!user || !workerId || photoFiles.length === 0) {
      toast.error("Pick at least one photo.");
      return;
    }
    setSubmitting(true);
    try {
      for (const file of photoFiles) {
        const result = await uploadToBucket("job-photos", user.id, file, `trades/${trade.slug}`);
        if ("error" in result) {
          toast.error("Upload failed: " + result.error);
          continue;
        }
        const { error } = await db.from("trade_project_photos").insert({
          worker_profile_id: workerId,
          trade_slug: trade.slug,
          storage_path: result.path,
          caption: caption || null,
        });
        if (error) {
          toast.error(error.message);
          continue;
        }
      }
      toast.success("Photos uploaded. Awaiting admin review.");
      setPhotoFiles([]);
      setCaption("");
      const phRes = await db
        .from("trade_project_photos")
        .select("*")
        .eq("worker_profile_id", workerId)
        .eq("trade_slug", trade.slug)
        .order("created_at", { ascending: false });
      setPhotos(phRes.data ?? []);
      // best-effort badge refresh after evidence updates
      await db.rpc("refresh_all_trade_badges_for_worker", { p_worker_profile_id: workerId });
    } finally {
      setSubmitting(false);
    }
  };

  const removePhoto = async (id: string) => {
    const { error } = await db.from("trade_project_photos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setPhotos((ps) => ps.filter((p) => p.id !== id));
  };

  if (loading) {
    return (
      <AppLayout role="worker" nav={workerNav}>
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!workerId) {
    return (
      <AppLayout role="worker" nav={workerNav}>
        <PageHeader eyebrow="Evidence" title="Build your profile first" />
        <Button onClick={() => navigate("/work/profile")}>Go to profile</Button>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="worker" nav={workerNav}>
      <Link to="/work/badges" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Badges
      </Link>
      <PageHeader
        eyebrow={trade.title}
        title="Evidence"
        description="Tag references to this trade and upload reviewed photos. Both need admin verification."
      />

      <div className="grid gap-6">
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold">Tag a reference for this trade</h3>
            {refs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You don't have any references yet. <Link to="/work/verification" className="text-primary underline">Add references</Link> first.
              </p>
            ) : (
              <div className="grid sm:grid-cols-3 gap-3 items-end">
                <div className="space-y-1.5">
                  <Label>Reference</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={refId}
                    onChange={(e) => setRefId(e.target.value)}
                  >
                    <option value="">Choose…</option>
                    {refs.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Job completion date</Label>
                  <Input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} />
                </div>
                <Button onClick={tagReference} disabled={submitting}>
                  <Plus className="h-4 w-4 mr-1" /> Tag reference
                </Button>
              </div>
            )}

            {tradeRefs.length > 0 && (
              <div className="grid gap-2 mt-3">
                {tradeRefs.map((tr) => (
                  <div key={tr.id} className="flex items-center justify-between rounded-md border border-border bg-card p-3 text-sm">
                    <div>
                      <span className="font-medium">{tr.worker_references?.name ?? "Reference"}</span>
                      <span className="text-muted-foreground"> · {tr.job_completion_date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {tr.verified_at ? (
                        <Badge>Verified</Badge>
                      ) : (
                        <Badge variant="outline">Pending review</Badge>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => removeTradeRef(tr.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold">Upload project photos</h3>
            <p className="text-sm text-muted-foreground">
              Aim for 9 reviewed photos across 3 different jobs to qualify.
            </p>
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label>Photos</Label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setPhotoFiles(Array.from(e.target.files ?? []))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Caption (optional)</Label>
                <Textarea rows={2} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Job site, what you did" />
              </div>
              <div>
                <Button onClick={uploadPhotos} disabled={submitting || photoFiles.length === 0}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Upload className="h-4 w-4 mr-1" /> Upload {photoFiles.length || ""}
                </Button>
              </div>
            </div>

            {photos.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-2 mt-3">
                {photos.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-md border border-border bg-card p-3 text-sm">
                    <div className="truncate">
                      <p className="font-medium truncate">{p.caption || p.storage_path.split("/").pop()}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.created_at ? format(new Date(p.created_at), "MMM d, yyyy") : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.reviewed_at ? (
                        <Badge>Reviewed</Badge>
                      ) : (
                        <Badge variant="outline">Pending review</Badge>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => removePhoto(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default TradeEvidence;
