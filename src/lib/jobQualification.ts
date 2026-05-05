// Pure TS mirror of public.worker_qualifies_for_job — used by the UI to
// decorate cards with ✓/🔒 indicators without hitting the DB. The DB
// function remains the source of truth for RLS and the worker feed.

export type JobTradeRequirement = {
  trade_slug: string;
  is_required: boolean;
};

export type WorkerBadge = {
  trade_slug: string;
  status: string;
  expires_at: string | null;
};

export type QualificationMode = "any" | "all";

export type QualifiesInput = {
  requiredTrades: JobTradeRequirement[];
  mode: QualificationMode;
  workerBadges: WorkerBadge[];
  now?: Date;
};

export type QualifiesResult = {
  qualifies: boolean;
  matchedTrades: string[];
  missingTrades: string[];
};

const isActiveBadge = (b: WorkerBadge, now: Date) => {
  if (b.status !== "active") return false;
  if (!b.expires_at) return true;
  return new Date(b.expires_at).getTime() > now.getTime();
};

export const qualifiesForJob = ({
  requiredTrades,
  mode,
  workerBadges,
  now,
}: QualifiesInput): QualifiesResult => {
  const at = now ?? new Date();
  const required = requiredTrades.filter((t) => t.is_required);

  // Back-compat: a job with no required trades is open to all workers.
  if (required.length === 0) {
    return { qualifies: true, matchedTrades: [], missingTrades: [] };
  }

  const activeSlugs = new Set(
    workerBadges.filter((b) => isActiveBadge(b, at)).map((b) => b.trade_slug),
  );

  const matched: string[] = [];
  const missing: string[] = [];
  for (const t of required) {
    if (activeSlugs.has(t.trade_slug)) matched.push(t.trade_slug);
    else missing.push(t.trade_slug);
  }

  const qualifies = mode === "all" ? missing.length === 0 : matched.length >= 1;
  return { qualifies, matchedTrades: matched, missingTrades: missing };
};
