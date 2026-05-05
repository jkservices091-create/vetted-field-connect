import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { adminNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { TRADES } from "@/lib/badges";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

type Row = {
  id: string;
  worker_profile_id: string;
  trade_slug: string;
  status: "active" | "expired" | "revoked" | "pending_review";
  issued_at: string;
  expires_at: string;
  revoked_at: string | null;
  revocation_reason: string | null;
  worker_name?: string;
};

const STATUSES = ["all", "active", "expired", "revoked", "pending_review"] as const;

const TradeBadges = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [tradeFilter, setTradeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUSES)[number]>("all");
  const [expiringSoon, setExpiringSoon] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [acting, setActing] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await db.from("trade_badges").select("*").order("issued_at", { ascending: false });
    const badges = (data ?? []) as Row[];

    // Pull worker names in batch
    const workerIds = Array.from(new Set(badges.map((b) => b.worker_profile_id)));
    const nameMap = new Map<string, string>();
    if (workerIds.length > 0) {
      const { data: wps } = await supabase.from("worker_profiles").select("id, user_id").in("id", workerIds);
      const wpsList = wps ?? [];
      const userIds = wpsList.map((w) => w.user_id);
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const userToName = new Map((profs ?? []).map((p) => [p.user_id, (p.full_name ?? "Unnamed worker") as string]));
      for (const wp of wpsList) {
        nameMap.set(wp.id, userToName.get(wp.user_id) ?? "Unnamed worker");
      }
    }
    setRows(badges.map((b) => ({ ...b, worker_name: nameMap.get(b.worker_profile_id) })));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter((r) => {
    if (tradeFilter !== "all" && r.trade_slug !== tradeFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (expiringSoon) {
      const cutoff = Date.now() + 30 * 24 * 60 * 60 * 1000;
      if (r.status !== "active" || new Date(r.expires_at).getTime() > cutoff) return false;
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!(r.worker_name ?? "").toLowerCase().includes(q) && !r.trade_slug.includes(q)) return false;
    }
    return true;
  });

  const revoke = async () => {
    if (!selected || !user) return;
    if (!revokeReason.trim()) {
      toast.error("Reason is required.");
      return;
    }
    setActing(true);
    const { error } = await db
      .from("trade_badges")
      .update({
        status: "revoked",
        revoked_at: new Date().toISOString(),
        revoked_by: user.id,
        revocation_reason: revokeReason.trim(),
      })
      .eq("id", selected.id);
    setActing(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Badge revoked.");
    setRevokeReason("");
    setSelected(null);
    load();
  };

  const tradeTitle = (slug: string) => TRADES.find((t) => t.slug === slug)?.title ?? slug;

  return (
    <AppLayout role="admin" nav={adminNav}>
      <PageHeader
        eyebrow="Admin"
        title="Trade badges"
        description="Issued, expired, and revoked badges across all workers."
      />

      <div className="grid sm:grid-cols-4 gap-3 mb-6">
        <div>
          <Label className="text-xs">Trade</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={tradeFilter}
            onChange={(e) => setTradeFilter(e.target.value)}
          >
            <option value="all">All trades</option>
            {TRADES.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs">Status</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as (typeof STATUSES)[number])}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs">Search worker</Label>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or trade slug" />
        </div>
        <label className="flex items-end gap-2 pb-1.5">
          <input type="checkbox" checked={expiringSoon} onChange={(e) => setExpiringSoon(e.target.checked)} />
          <span className="text-sm">Expiring within 30 days</span>
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground text-sm">No badges match those filters.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                setSelected(b);
                setRevokeReason("");
              }}
              className="text-left rounded-md border border-border bg-card p-4 hover:bg-muted/50 transition-colors flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-medium">{b.worker_name ?? "Unnamed worker"}</p>
                <p className="text-sm text-muted-foreground">{tradeTitle(b.trade_slug)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={b.status === "active" ? "default" : b.status === "revoked" ? "destructive" : "secondary"}>
                  {b.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {b.status === "active" ? `expires ${format(new Date(b.expires_at), "MMM d, yyyy")}` : ""}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.worker_name ?? "Worker"} · {tradeTitle(selected.trade_slug)}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-sm">
                <KV label="Status" value={selected.status} />
                <KV label="Issued" value={format(new Date(selected.issued_at), "PP")} />
                <KV label="Expires" value={format(new Date(selected.expires_at), "PP")} />
                {selected.revoked_at && (
                  <>
                    <KV label="Revoked" value={format(new Date(selected.revoked_at), "PP")} />
                    {selected.revocation_reason && <KV label="Reason" value={selected.revocation_reason} />}
                  </>
                )}
                <Button asChild variant="outline" size="sm">
                  <Link to={`/admin/workers/${selected.worker_profile_id}`}>Open worker review</Link>
                </Button>
              </div>

              {selected.status === "active" && (
                <div className="mt-6 space-y-3">
                  <Label>Revocation reason</Label>
                  <Textarea
                    rows={3}
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    placeholder="Why is this badge being revoked?"
                  />
                  <Button variant="destructive" onClick={revoke} disabled={acting}>
                    {acting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <ShieldX className="h-4 w-4 mr-1" /> Revoke badge
                  </Button>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
};

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

export default TradeBadges;
