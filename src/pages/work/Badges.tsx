import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { workerNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Check, ClipboardCheck, Loader2, Camera, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { TRADES, REQUIRED_VERIFIED_REFS, REQUIRED_REVIEWED_PHOTOS, computeBadgeEligibility } from "@/lib/badges";
import { format } from "date-fns";

export type BadgeRow = {
  id: string;
  trade_slug: string;
  status: "active" | "expired" | "revoked" | "pending_review";
  issued_at: string;
  expires_at: string;
};

type Counts = { quizPassed: boolean; verifiedRefs: number; reviewedPhotos: number };

export function BadgesView({
  badges,
  counts,
}: {
  badges: BadgeRow[];
  counts: Record<string, Counts>;
}) {
  const byTrade = new Map(badges.map((b) => [b.trade_slug, b]));

  return (
    <div className="grid gap-4">
      {TRADES.map((trade) => {
        const badge = byTrade.get(trade.slug);
        const c = counts[trade.slug] ?? { quizPassed: false, verifiedRefs: 0, reviewedPhotos: 0 };
        const elig = computeBadgeEligibility(c.quizPassed, c.verifiedRefs, c.reviewedPhotos);
        const status: "active" | "expired" | "revoked" | "pending" | "not_started" =
          badge?.status === "active"
            ? "active"
            : badge?.status === "expired"
            ? "expired"
            : badge?.status === "revoked"
            ? "revoked"
            : c.quizPassed || c.verifiedRefs > 0 || c.reviewedPhotos > 0
            ? "pending"
            : "not_started";

        return (
          <Card key={trade.slug} data-testid={`trade-card-${trade.slug}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">{trade.title}</h3>
                    <div className="mt-1.5">
                      {status === "active" && badge && (
                        <Badge variant="default" data-testid={`status-${trade.slug}`}>
                          Active until {format(new Date(badge.expires_at), "MMM d, yyyy")}
                        </Badge>
                      )}
                      {status === "expired" && (
                        <Badge variant="secondary" data-testid={`status-${trade.slug}`}>Expired</Badge>
                      )}
                      {status === "revoked" && (
                        <Badge variant="destructive" data-testid={`status-${trade.slug}`}>Revoked</Badge>
                      )}
                      {status === "pending" && (
                        <Badge variant="outline" data-testid={`status-${trade.slug}`}>
                          Pending — {elig.refsRemaining > 0 ? `${elig.refsRemaining} more refs` : ""}
                          {elig.refsRemaining > 0 && elig.photosRemaining > 0 ? ", " : ""}
                          {elig.photosRemaining > 0 ? `${elig.photosRemaining} more photos` : ""}
                          {elig.refsRemaining === 0 && elig.photosRemaining === 0 && !elig.quizPassed ? "quiz" : ""}
                        </Badge>
                      )}
                      {status === "not_started" && (
                        <Badge variant="outline" data-testid={`status-${trade.slug}`}>Not started</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/work/trade-evidence/${trade.slug}`}>
                      <FileText className="h-4 w-4 mr-1" /> Add evidence
                    </Link>
                  </Button>
                </div>
              </div>

              <ul className="mt-4 grid sm:grid-cols-3 gap-2 text-sm">
                <Checklist
                  ok={elig.quizPassed}
                  icon={ClipboardCheck}
                  label={elig.quizPassed ? "Quiz passed" : "Pass the quiz"}
                />
                <Checklist
                  ok={elig.refsMet}
                  icon={FileText}
                  label={`${c.verifiedRefs}/${REQUIRED_VERIFIED_REFS} verified refs`}
                />
                <Checklist
                  ok={elig.photosMet}
                  icon={Camera}
                  label={`${c.reviewedPhotos}/${REQUIRED_REVIEWED_PHOTOS} reviewed photos`}
                />
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function Checklist({
  ok,
  icon: Icon,
  label,
}: {
  ok: boolean;
  icon: typeof Check;
  label: string;
}) {
  return (
    <li
      className={`flex items-center gap-2 rounded-md border px-3 py-2 ${
        ok ? "border-success/30 bg-success/10 text-success" : "border-border bg-muted/30 text-muted-foreground"
      }`}
    >
      {ok ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      <span>{label}</span>
    </li>
  );
}

const Badges = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<BadgeRow[]>([]);
  const [counts, setCounts] = useState<Record<string, Counts>>({});

  useEffect(() => {
    if (!user) return;
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

      const [badgesRes, refsRes, photosRes, quizPassedRes] = await Promise.all([
        db.from("trade_badges").select("*").eq("worker_profile_id", wp.id),
        db
          .from("trade_references")
          .select("trade_slug, verified_at, job_completion_date, worker_reference:worker_references!inner(worker_profile_id)")
          .eq("worker_reference.worker_profile_id", wp.id),
        db
          .from("trade_project_photos")
          .select("trade_slug, reviewed_at")
          .eq("worker_profile_id", wp.id),
        supabase
          .from("quiz_attempts")
          .select("quiz_id, result, submitted_at, quizzes!inner(slug)")
          .eq("worker_profile_id", wp.id)
          .eq("result", "passed"),
      ]);

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const map: Record<string, Counts> = {};
      for (const t of TRADES) map[t.slug] = { quizPassed: false, verifiedRefs: 0, reviewedPhotos: 0 };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const r of (refsRes.data ?? []) as any[]) {
        if (!map[r.trade_slug]) continue;
        if (r.verified_at && new Date(r.job_completion_date) >= sixMonthsAgo) {
          map[r.trade_slug].verifiedRefs += 1;
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const p of (photosRes.data ?? []) as any[]) {
        if (!map[p.trade_slug]) continue;
        if (p.reviewed_at) map[p.trade_slug].reviewedPhotos += 1;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const a of (quizPassedRes.data ?? []) as any[]) {
        const slug = a.quizzes?.slug;
        if (slug && map[slug] && a.submitted_at && new Date(a.submitted_at) >= twelveMonthsAgo) {
          map[slug].quizPassed = true;
        }
      }

      setBadges((badgesRes.data ?? []) as BadgeRow[]);
      setCounts(map);
      setLoading(false);
    })();
  }, [user]);

  return (
    <AppLayout role="worker" nav={workerNav}>
      <PageHeader
        eyebrow="Trade badges"
        title="My badges"
        description="Earn a badge per trade by passing the quiz, verifying 3 recent jobs, and submitting 9 reviewed photos."
      />
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <BadgesView badges={badges} counts={counts} />
      )}
    </AppLayout>
  );
};

export default Badges;
