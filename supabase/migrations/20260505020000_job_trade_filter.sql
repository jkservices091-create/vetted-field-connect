-- =========================================================
-- JOB TRADE FILTER — tag jobs with required trades, gate worker feed
-- Depends on:
--   20260418215450_*.sql              (jobs, job_applications, worker_profiles, hiring_party_profiles)
--   20260505001807_quizzes.sql        (PR #1)
--   20260505010000_trade_badges.sql   (PR #2 — public.trades, public.trade_badges)
-- =========================================================

-- =========================================================
-- ALTER: jobs — qualification mode
-- =========================================================
ALTER TABLE public.jobs
  ADD COLUMN qualification_mode TEXT NOT NULL DEFAULT 'any'
    CHECK (qualification_mode IN ('any', 'all'));

-- =========================================================
-- TABLE: job_trades — link table tagging which trades a job requires
-- =========================================================
CREATE TABLE public.job_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  trade_slug TEXT NOT NULL REFERENCES public.trades(slug),
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, trade_slug)
);
ALTER TABLE public.job_trades ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_job_trades_trade ON public.job_trades(trade_slug);
CREATE INDEX idx_job_trades_job ON public.job_trades(job_id);

-- =========================================================
-- FUNCTION: worker_qualifies_for_job
-- Returns true when:
--   - the job has no required job_trades rows (back-compat with pre-PR3 jobs), OR
--   - the worker has matching active+unexpired trade_badges per qualification_mode.
-- =========================================================
CREATE OR REPLACE FUNCTION public.worker_qualifies_for_job(
  p_job_id UUID,
  p_worker_profile_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mode TEXT;
  v_required_count INT;
  v_match_count INT;
BEGIN
  IF p_worker_profile_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT qualification_mode INTO v_mode
  FROM public.jobs WHERE id = p_job_id;
  IF v_mode IS NULL THEN
    v_mode := 'any';
  END IF;

  SELECT COUNT(*) INTO v_required_count
  FROM public.job_trades
  WHERE job_id = p_job_id AND is_required = true;

  -- Back-compat: jobs with no required trades are visible to everyone.
  IF v_required_count = 0 THEN
    RETURN TRUE;
  END IF;

  SELECT COUNT(*) INTO v_match_count
  FROM public.job_trades jt
  JOIN public.trade_badges tb
    ON tb.trade_slug = jt.trade_slug
   AND tb.worker_profile_id = p_worker_profile_id
   AND tb.status = 'active'
   AND tb.expires_at > now()
  WHERE jt.job_id = p_job_id AND jt.is_required = true;

  IF v_mode = 'all' THEN
    RETURN v_match_count >= v_required_count;
  ELSE
    RETURN v_match_count >= 1;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.worker_qualifies_for_job(UUID, UUID) TO authenticated;

-- =========================================================
-- VIEW: worker_visible_jobs — canonical worker feed query.
-- Uses auth.uid() to look up the calling worker's worker_profile_id, then
-- returns open jobs the worker is qualified for. Jobs with NO required
-- job_trades rows remain visible to all workers (back-compat).
-- SECURITY INVOKER so RLS still applies on the underlying jobs table.
-- =========================================================
CREATE OR REPLACE VIEW public.worker_visible_jobs
WITH (security_invoker = true) AS
SELECT j.*
FROM public.jobs j
WHERE j.status = 'open'
  AND public.worker_qualifies_for_job(
    j.id,
    (SELECT wp.id FROM public.worker_profiles wp WHERE wp.user_id = auth.uid())
  );

GRANT SELECT ON public.worker_visible_jobs TO authenticated;

-- =========================================================
-- FUNCTION: count_qualified_workers
-- Returns the number of distinct workers with badges that satisfy a job's
-- qualification_mode. Used by the hirer "Workers who match" indicator.
-- Callable by the job owner or admins only.
-- =========================================================
CREATE OR REPLACE FUNCTION public.count_qualified_workers(p_job_id UUID)
RETURNS INT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mode TEXT;
  v_required_count INT;
  v_count INT;
  v_owner_user_id UUID;
BEGIN
  -- Authorize: caller must be the job owner or an admin.
  SELECT hpp.user_id INTO v_owner_user_id
  FROM public.jobs j
  JOIN public.hiring_party_profiles hpp ON hpp.id = j.hiring_party_id
  WHERE j.id = p_job_id;

  IF v_owner_user_id IS NULL THEN
    RETURN 0;
  END IF;

  IF v_owner_user_id <> auth.uid() AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to count qualified workers for this job';
  END IF;

  SELECT qualification_mode INTO v_mode FROM public.jobs WHERE id = p_job_id;
  IF v_mode IS NULL THEN v_mode := 'any'; END IF;

  SELECT COUNT(*) INTO v_required_count
  FROM public.job_trades WHERE job_id = p_job_id AND is_required = true;

  IF v_required_count = 0 THEN
    SELECT COUNT(*) INTO v_count FROM public.worker_profiles
    WHERE vetting_status IN ('verified', 'verified_pro');
    RETURN COALESCE(v_count, 0);
  END IF;

  IF v_mode = 'all' THEN
    SELECT COUNT(*) INTO v_count FROM (
      SELECT tb.worker_profile_id
      FROM public.trade_badges tb
      JOIN public.job_trades jt ON jt.trade_slug = tb.trade_slug
      WHERE jt.job_id = p_job_id AND jt.is_required = true
        AND tb.status = 'active' AND tb.expires_at > now()
      GROUP BY tb.worker_profile_id
      HAVING COUNT(DISTINCT tb.trade_slug) >= v_required_count
    ) q;
  ELSE
    SELECT COUNT(DISTINCT tb.worker_profile_id) INTO v_count
    FROM public.trade_badges tb
    JOIN public.job_trades jt ON jt.trade_slug = tb.trade_slug
    WHERE jt.job_id = p_job_id AND jt.is_required = true
      AND tb.status = 'active' AND tb.expires_at > now();
  END IF;

  RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.count_qualified_workers(UUID) TO authenticated;

-- =========================================================
-- VIEW: open_jobs_by_trade — admin KPI "top trades by open job count".
-- Counts each open job once per required trade.
-- =========================================================
CREATE OR REPLACE VIEW public.open_jobs_by_trade
WITH (security_invoker = true) AS
SELECT
  jt.trade_slug,
  t.title AS trade_title,
  COUNT(*)::INT AS open_job_count
FROM public.job_trades jt
JOIN public.jobs j ON j.id = jt.job_id
JOIN public.trades t ON t.slug = jt.trade_slug
WHERE j.status = 'open' AND jt.is_required = true
GROUP BY jt.trade_slug, t.title
ORDER BY open_job_count DESC;

GRANT SELECT ON public.open_jobs_by_trade TO authenticated;

-- =========================================================
-- RLS POLICIES — job_trades
-- =========================================================
CREATE POLICY "Job trades read by authenticated"
  ON public.job_trades FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Job trades hirer manage own"
  ON public.job_trades FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.hiring_party_profiles hpp ON hpp.id = j.hiring_party_id
    WHERE j.id = job_trades.job_id AND hpp.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.hiring_party_profiles hpp ON hpp.id = j.hiring_party_id
    WHERE j.id = job_trades.job_id AND hpp.user_id = auth.uid()
  ));

CREATE POLICY "Job trades admin all"
  ON public.job_trades FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================
-- RLS POLICIES — jobs (worker visibility gate)
-- Workers see open jobs only when they qualify, OR jobs that aren't 'open'
-- (so they retain visibility into jobs they've previously applied to even
-- if their badge expires later). Existing hirer/admin policies are intact.
-- =========================================================
CREATE POLICY "Jobs worker qualified view"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (
    status <> 'open'
    OR public.worker_qualifies_for_job(
         id,
         (SELECT wp.id FROM public.worker_profiles wp WHERE wp.user_id = auth.uid())
       )
  );

-- =========================================================
-- RLS POLICIES — job_applications: gate INSERT on qualification.
-- Hirers/admins keep their existing policies via the migration above.
-- =========================================================
CREATE POLICY "JA worker qualified insert"
  ON public.job_applications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.worker_profiles wp
      WHERE wp.id = worker_profile_id AND wp.user_id = auth.uid()
    )
    AND public.worker_qualifies_for_job(job_id, worker_profile_id)
  );
