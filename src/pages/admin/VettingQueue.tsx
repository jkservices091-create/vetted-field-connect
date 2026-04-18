import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { adminNav } from "@/lib/nav";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRight } from "lucide-react";
import { TrustBadge } from "@/components/TrustBadge";
import { format } from "date-fns";

const VettingQueue = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: subs } = await supabase
        .from("verification_submissions")
        .select("*")
        .eq("decision", "pending")
        .order("submitted_at", { ascending: true });
      if (!subs || subs.length === 0) { setItems([]); setLoading(false); return; }
      const wpIds = subs.map((s) => s.worker_profile_id);
      const { data: wps } = await supabase
        .from("worker_profiles")
        .select("id, user_id, city, vetting_status")
        .in("id", wpIds);
      const userIds = (wps ?? []).map((w) => w.user_id);
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      const profMap: Record<string, any> = {};
      (profs ?? []).forEach((p) => (profMap[p.user_id] = p));
      const wpMap: Record<string, any> = {};
      (wps ?? []).forEach((w) => (wpMap[w.id] = { ...w, profile: profMap[w.user_id] }));
      setItems(subs.map((s) => ({ sub: s, worker: wpMap[s.worker_profile_id] })));
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <AppLayout role="admin" nav={adminNav}>
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="admin" nav={adminNav}>
      <PageHeader eyebrow="Vetting queue" title="Pending applications" description={`${items.length} awaiting review`} />
      {items.length === 0 ? (
        <EmptyState title="Inbox zero" description="No applications pending. Nice work." />
      ) : (
        <div className="grid gap-3">
          {items.map(({ sub, worker }) => (
            <Link key={sub.id} to={`/admin/workers/${worker?.id}`} className="rounded-lg border border-border bg-card p-4 hover:border-primary/50 flex items-center justify-between gap-3 transition-all">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold">{worker?.profile?.full_name ?? "Unknown worker"}</h3>
                  {worker && <TrustBadge status={worker.vetting_status} />}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {worker?.city ?? "—"} · Submitted {format(new Date(sub.submitted_at), "MMM d, h:mm a")}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default VettingQueue;
