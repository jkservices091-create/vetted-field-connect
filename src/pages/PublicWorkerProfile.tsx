import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Award, ExternalLink, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { TRADES } from "@/lib/badges";
import { format } from "date-fns";

type ActiveBadge = {
  id: string;
  trade_slug: string;
  status: string;
  issued_at: string;
  expires_at: string;
};

type WorkerView = {
  workerProfileId: string;
  fullName: string;
  city: string | null;
  bio: string | null;
  badges: ActiveBadge[];
  verifiedJobsCount: number;
};

export function PublicWorkerProfileView({ worker, handle }: { worker: WorkerView; handle: string }) {
  const tradeTitle = (slug: string) => TRADES.find((t) => t.slug === slug)?.title ?? slug;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo />
          <Button asChild size="sm">
            <Link to={`/for-hiring?ref=worker:${handle}`}>Hire on FieldHands</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="rounded-xl border border-border bg-card p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:justify-between">
            <div>
              <span className="eyebrow">Vetted worker</span>
              <h1 className="display-lg mt-2" data-testid="public-worker-name">{worker.fullName}</h1>
              {worker.city && (
                <p className="mt-2 text-muted-foreground inline-flex items-center gap-1 text-sm">
                  <MapPin className="h-3.5 w-3.5" /> {worker.city}
                </p>
              )}
            </div>
            <Button asChild>
              <Link to={`/for-hiring?ref=worker:${handle}`}>
                Hire this worker <ExternalLink className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {worker.bio && <p className="mt-5 text-sm whitespace-pre-wrap">{worker.bio}</p>}

          <dl className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Stat label="Active badges" value={String(worker.badges.length)} />
            <Stat label="Verified jobs" value={String(worker.verifiedJobsCount)} />
            <Stat label="Trades" value={String(worker.badges.length)} />
          </dl>
        </div>

        <section className="mt-10">
          <h2 className="display-md text-2xl mb-4">Trade badges</h2>
          {worker.badges.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active badges yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {worker.badges.map((b) => (
                <Card key={b.id} data-testid={`public-badge-${b.trade_slug}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <Award className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-semibold">{tradeTitle(b.trade_slug)}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Issued {format(new Date(b.issued_at), "MMM yyyy")} · expires{" "}
                          {format(new Date(b.expires_at), "MMM d, yyyy")}
                        </p>
                        <Badge className="mt-2">Active</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-16 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          Vetted by <Link to="/" className="text-primary hover:underline">FieldHands</Link>. Badges expire 12 months
          after issue and are reviewed annually.
        </footer>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card/50 p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">{label}</div>
      <div className="display-md text-2xl">{value}</div>
    </div>
  );
}

const PublicWorkerProfile = () => {
  const { handle = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState<WorkerView | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setNotFound(false);
      const { data: handleRow } = await db
        .from("public_worker_handles")
        .select("worker_profile_id, is_public")
        .eq("handle", handle.toLowerCase())
        .maybeSingle();

      if (!handleRow || !handleRow.is_public) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const wpid = handleRow.worker_profile_id;

      const [{ data: wp }, badgesRes, refsCount] = await Promise.all([
        supabase.from("worker_profiles").select("user_id, city, bio").eq("id", wpid).maybeSingle(),
        db.from("public_trade_badges").select("*").eq("worker_profile_id", wpid),
        db
          .from("trade_references")
          .select("id, worker_references!inner(worker_profile_id)", { count: "exact", head: true })
          .eq("worker_references.worker_profile_id", wpid)
          .not("verified_at", "is", null),
      ]);

      if (!wp) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", wp.user_id)
        .maybeSingle();

      const view: WorkerView = {
        workerProfileId: wpid,
        fullName: prof?.full_name ?? "FieldHands worker",
        city: wp.city,
        bio: wp.bio,
        badges: (badgesRes.data ?? []) as ActiveBadge[],
        verifiedJobsCount: refsCount.count ?? 0,
      };
      setWorker(view);
      setLoading(false);
    })();
  }, [handle]);

  // SEO: title + meta description (no react-helmet in deps; set directly)
  useEffect(() => {
    if (!worker) return;
    const title = `${worker.fullName} — Vetted ${worker.badges.length}-trade worker | FieldHands`;
    document.title = title;
    const desc = worker.bio
      ? worker.bio.slice(0, 155)
      : `${worker.fullName} is a FieldHands-vetted worker${
          worker.city ? ` in ${worker.city}` : ""
        } with ${worker.badges.length} active trade badge${worker.badges.length === 1 ? "" : "s"}.`;
    setMeta("description", desc);
    setMeta("og:title", title, true);
    setMeta("og:description", desc, true);
    setMeta("og:type", "profile", true);
    setMeta("twitter:card", "summary");
  }, [worker]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !worker) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="display-lg">Profile not found</h1>
        <p className="text-muted-foreground mt-2">This handle doesn't exist or the worker has set their profile to private.</p>
        <Button asChild className="mt-6">
          <Link to="/">Back to FieldHands</Link>
        </Button>
      </div>
    );
  }

  return <PublicWorkerProfileView worker={worker} handle={handle} />;
};

function setMeta(name: string, content: string, isOg = false) {
  const attr = isOg ? "property" : "name";
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export default PublicWorkerProfile;
