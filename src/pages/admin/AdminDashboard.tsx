import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { adminNav } from "@/lib/nav";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldCheck, Clock, Users, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, verified: 0, hirers: 0, openJobs: 0 });

  useEffect(() => {
    (async () => {
      const [pending, verified, hirers, openJobs] = await Promise.all([
        supabase.from("verification_submissions").select("id", { count: "exact", head: true }).eq("decision", "pending"),
        supabase.from("worker_profiles").select("id", { count: "exact", head: true }).in("vetting_status", ["verified", "verified_pro"]),
        supabase.from("hiring_party_profiles").select("id", { count: "exact", head: true }),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "open"),
      ]);
      setStats({
        pending: pending.count ?? 0,
        verified: verified.count ?? 0,
        hirers: hirers.count ?? 0,
        openJobs: openJobs.count ?? 0,
      });
      setLoading(false);
    })();
  }, []);

  return (
    <AppLayout role="admin" nav={adminNav}>
      <PageHeader
        eyebrow="Admin"
        title="Trust & operations"
        description="Review applications, manage users, and keep the network clean."
        actions={<Button asChild size="lg"><Link to="/admin/queue">Open vetting queue</Link></Button>}
      />
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Pending review" value={stats.pending} icon={Clock} highlight={stats.pending > 0} />
          <Stat label="Verified workers" value={stats.verified} icon={ShieldCheck} />
          <Stat label="Hiring companies" value={stats.hirers} icon={Users} />
          <Stat label="Open jobs" value={stats.openJobs} icon={Briefcase} />
        </div>
      )}
    </AppLayout>
  );
};

function Stat({ label, value, icon: Icon, highlight }: { label: string; value: number; icon: any; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-5 ${highlight ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
        <Icon className={`h-4 w-4 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className="display-md text-3xl mt-2">{value}</div>
    </div>
  );
}

export default AdminDashboard;
