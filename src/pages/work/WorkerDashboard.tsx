import { AppLayout } from "@/components/AppLayout";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { workerNav } from "@/lib/nav";
import { TrustBadge } from "@/components/TrustBadge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search, ClipboardCheck, User, BookCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type WorkerProfile = {
  id: string;
  vetting_status: "applicant" | "pending_review" | "verified" | "verified_pro" | "rejected";
  city: string | null;
};

const WorkerDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<WorkerProfile | null | undefined>(undefined);
  const [bookingCount, setBookingCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("worker_profiles")
        .select("id, vetting_status, city")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile(data);
      if (data) {
        const { count } = await supabase
          .from("job_applications")
          .select("id", { count: "exact", head: true })
          .eq("worker_profile_id", data.id);
        setBookingCount(count ?? 0);
      }
    })();
  }, [user]);

  if (profile === undefined) return null;

  return (
    <AppLayout role="worker" nav={workerNav}>
      <PageHeader
        eyebrow="Worker dashboard"
        title="Welcome to FieldHands"
        description="Get verified, find work, build your reputation."
        actions={profile?.vetting_status === "verified" || profile?.vetting_status === "verified_pro" ? (
          <Button asChild size="lg"><Link to="/work/jobs"><Search className="mr-1" /> Find work</Link></Button>
        ) : null}
      />

      {!profile && (
        <EmptyState
          title="Set up your profile first"
          description="Tell hirers who you are and what you can do."
          action={<Button asChild size="lg"><Link to="/work/profile"><User className="mr-1" /> Create profile</Link></Button>}
        />
      )}

      {profile && (
        <>
          <div className="rounded-lg border border-border bg-card p-5 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Your status</div>
                <TrustBadge status={profile.vetting_status} />
              </div>
              {profile.vetting_status === "applicant" && (
                <Button asChild><Link to="/work/verification"><ClipboardCheck className="mr-1" /> Start verification</Link></Button>
              )}
              {profile.vetting_status === "pending_review" && (
                <p className="text-sm text-muted-foreground">Our team is reviewing your application.</p>
              )}
              {(profile.vetting_status === "verified" || profile.vetting_status === "verified_pro") && (
                <Button asChild><Link to="/work/jobs">Browse open jobs</Link></Button>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <StatCard label="City" value={profile.city ?? "—"} icon={User} />
            <StatCard label="Bids submitted" value={String(bookingCount)} icon={Search} />
            <StatCard label="Bookings" value="0" icon={BookCheck} />
          </div>
        </>
      )}
    </AppLayout>
  );
};

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof User }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="display-md text-2xl mt-2">{value}</div>
    </div>
  );
}

export default WorkerDashboard;
