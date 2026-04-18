import { AppLayout } from "@/components/AppLayout";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { hirerNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Briefcase, PlusCircle, MessageSquare, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const HirerDashboard = () => {
  const { user } = useAuth();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [counts, setCounts] = useState({ open: 0, in_progress: 0, completed: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await supabase
        .from("hiring_party_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      setHasProfile(!!profile);
      if (profile) {
        const { data: jobs } = await supabase
          .from("jobs")
          .select("status")
          .eq("hiring_party_id", profile.id);
        const c = { open: 0, in_progress: 0, completed: 0 };
        (jobs ?? []).forEach((j) => {
          if (j.status in c) c[j.status as keyof typeof c]++;
        });
        setCounts(c);
      }
    })();
  }, [user]);

  return (
    <AppLayout role="hiring_party" nav={hirerNav}>
      <PageHeader
        eyebrow="Hirer dashboard"
        title="Welcome back"
        description="Post jobs, review bids, and manage your crew."
        actions={
          <Button asChild size="lg"><Link to="/hire/jobs/new"><PlusCircle className="mr-1" /> Post a job</Link></Button>
        }
      />

      {hasProfile === false && (
        <div className="mb-6 rounded-lg border border-primary/40 bg-primary/5 p-5 flex items-start gap-4">
          <Briefcase className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold">Set up your company</h3>
            <p className="text-sm text-muted-foreground mt-1">Workers want to know who they're working for. Takes 2 minutes.</p>
          </div>
          <Button asChild><Link to="/hire/profile">Set up</Link></Button>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Open jobs" value={counts.open} icon={Briefcase} />
        <StatCard label="In progress" value={counts.in_progress} icon={MessageSquare} />
        <StatCard label="Completed" value={counts.completed} icon={Star} />
      </div>

      {counts.open + counts.in_progress + counts.completed === 0 && hasProfile && (
        <EmptyState
          title="No jobs yet"
          description="Post your first labor job and start getting bids from vetted workers."
          action={<Button asChild size="lg"><Link to="/hire/jobs/new">Post your first job</Link></Button>}
        />
      )}
    </AppLayout>
  );
};

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Briefcase }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="display-md text-3xl mt-2">{value}</div>
    </div>
  );
}

export default HirerDashboard;
