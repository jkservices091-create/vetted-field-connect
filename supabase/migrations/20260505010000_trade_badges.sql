-- =========================================================
-- TRADE BADGES — per-trade qualification badges + public worker profiles
-- Depends on: 20260505001807_quizzes.sql (quizzes, quiz_attempts)
-- =========================================================

-- ENUM
CREATE TYPE public.badge_status AS ENUM ('active', 'expired', 'revoked', 'pending_review');

-- =========================================================
-- TABLE: trades (canonical list of supported trades)
-- =========================================================
CREATE TABLE public.trades (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

INSERT INTO public.trades (slug, title, display_order) VALUES
  ('site-prep-excavation', 'Site Prep & Excavation', 1),
  ('concrete-foundations', 'Concrete & Foundations', 2),
  ('framing-rough-carpentry', 'Framing & Rough Carpentry', 3),
  ('roofing', 'Roofing', 4),
  ('siding-exterior-finish', 'Siding & Exterior Finish', 5),
  ('windows-doors', 'Windows & Doors', 6),
  ('insulation-air-sealing', 'Insulation & Air Sealing', 7),
  ('drywall-plaster', 'Drywall & Plaster', 8),
  ('painting', 'Painting', 9),
  ('finish-carpentry-trim', 'Finish Carpentry & Trim', 10),
  ('flooring', 'Flooring', 11),
  ('tile-stone', 'Tile & Stone', 12),
  ('plumbing', 'Plumbing', 13),
  ('electrical', 'Electrical', 14),
  ('hvac', 'HVAC', 15),
  ('cabinetry-countertops', 'Cabinetry & Countertops', 16),
  ('landscaping-hardscaping', 'Landscaping & Hardscaping', 17),
  ('handyman-punch-list', 'Handyman & Punch List', 18);

-- =========================================================
-- TABLE: trade_references — link table tagging refs to trades
-- =========================================================
CREATE TABLE public.trade_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_reference_id UUID NOT NULL REFERENCES public.worker_references(id) ON DELETE CASCADE,
  trade_slug TEXT NOT NULL REFERENCES public.trades(slug),
  job_completion_date DATE NOT NULL,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (worker_reference_id, trade_slug)
);
ALTER TABLE public.trade_references ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_trade_references_trade ON public.trade_references(trade_slug);
CREATE INDEX idx_trade_references_ref ON public.trade_references(worker_reference_id);

-- =========================================================
-- TABLE: trade_project_photos — photos tagged to a worker + trade
-- =========================================================
CREATE TABLE public.trade_project_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  trade_slug TEXT NOT NULL REFERENCES public.trades(slug),
  storage_path TEXT NOT NULL,
  caption TEXT,
  taken_on DATE,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trade_project_photos ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_trade_project_photos_worker_trade ON public.trade_project_photos(worker_profile_id, trade_slug);

-- =========================================================
-- TABLE: trade_badges — issued badges
-- =========================================================
CREATE TABLE public.trade_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  trade_slug TEXT NOT NULL REFERENCES public.trades(slug),
  status public.badge_status NOT NULL DEFAULT 'active',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '12 months'),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  revocation_reason TEXT,
  quiz_attempt_id UUID REFERENCES public.quiz_attempts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (worker_profile_id, trade_slug)
);
ALTER TABLE public.trade_badges ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_trade_badges_worker ON public.trade_badges(worker_profile_id);
CREATE INDEX idx_trade_badges_status ON public.trade_badges(status);
CREATE INDEX idx_trade_badges_expires ON public.trade_badges(expires_at);
CREATE TRIGGER trade_badges_set_updated_at BEFORE UPDATE ON public.trade_badges
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- TABLE: public_worker_handles — vanity slugs for public profiles
-- =========================================================
CREATE TABLE public.public_worker_handles (
  worker_profile_id UUID PRIMARY KEY REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  handle TEXT UNIQUE NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT public_worker_handles_handle_format CHECK (
    handle ~ '^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$'
    AND length(handle) BETWEEN 3 AND 32
  )
);
ALTER TABLE public.public_worker_handles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER public_worker_handles_set_updated_at BEFORE UPDATE ON public.public_worker_handles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- VIEW: public_trade_badges — joins active+public-only for anonymous reads
-- =========================================================
CREATE VIEW public.public_trade_badges
WITH (security_invoker = true) AS
SELECT
  tb.id,
  tb.worker_profile_id,
  tb.trade_slug,
  tb.status,
  tb.issued_at,
  tb.expires_at
FROM public.trade_badges tb
JOIN public.public_worker_handles h ON h.worker_profile_id = tb.worker_profile_id
WHERE tb.status = 'active' AND h.is_public = true;

-- =========================================================
-- RLS POLICIES — trades (public read)
-- =========================================================
CREATE POLICY "Trades public read" ON public.trades
  FOR SELECT USING (true);
CREATE POLICY "Trades admin all" ON public.trades
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================
-- RLS POLICIES — public_worker_handles
-- =========================================================
CREATE POLICY "Handles public read" ON public.public_worker_handles
  FOR SELECT USING (true);
CREATE POLICY "Worker manages own handle" ON public.public_worker_handles
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.worker_profiles wp
    WHERE wp.id = worker_profile_id AND wp.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.worker_profiles wp
    WHERE wp.id = worker_profile_id AND wp.user_id = auth.uid()
  ));
CREATE POLICY "Handles admin all" ON public.public_worker_handles
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================
-- RLS POLICIES — trade_badges
-- Workers see their own; the public view handles anonymous reads.
-- =========================================================
CREATE POLICY "Badges worker view own" ON public.trade_badges
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.worker_profiles wp
    WHERE wp.id = worker_profile_id AND wp.user_id = auth.uid()
  ));
CREATE POLICY "Badges admin all" ON public.trade_badges
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Allow anonymous + authenticated to SELECT through the view
GRANT SELECT ON public.public_trade_badges TO anon, authenticated;

-- =========================================================
-- RLS POLICIES — trade_references
-- Workers see/manage their own; admins all. No public read.
-- =========================================================
CREATE POLICY "Trade refs worker view own" ON public.trade_references
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.worker_references wr
    JOIN public.worker_profiles wp ON wp.id = wr.worker_profile_id
    WHERE wr.id = worker_reference_id AND wp.user_id = auth.uid()
  ));
CREATE POLICY "Trade refs worker insert own" ON public.trade_references
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.worker_references wr
    JOIN public.worker_profiles wp ON wp.id = wr.worker_profile_id
    WHERE wr.id = worker_reference_id AND wp.user_id = auth.uid()
  ));
CREATE POLICY "Trade refs worker update own" ON public.trade_references
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.worker_references wr
    JOIN public.worker_profiles wp ON wp.id = wr.worker_profile_id
    WHERE wr.id = worker_reference_id AND wp.user_id = auth.uid()
  ));
CREATE POLICY "Trade refs worker delete own" ON public.trade_references
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.worker_references wr
    JOIN public.worker_profiles wp ON wp.id = wr.worker_profile_id
    WHERE wr.id = worker_reference_id AND wp.user_id = auth.uid()
  ));
CREATE POLICY "Trade refs admin all" ON public.trade_references
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================
-- RLS POLICIES — trade_project_photos
-- =========================================================
CREATE POLICY "Trade photos worker view own" ON public.trade_project_photos
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.worker_profiles wp
    WHERE wp.id = worker_profile_id AND wp.user_id = auth.uid()
  ));
CREATE POLICY "Trade photos worker insert own" ON public.trade_project_photos
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.worker_profiles wp
    WHERE wp.id = worker_profile_id AND wp.user_id = auth.uid()
  ));
CREATE POLICY "Trade photos worker update own" ON public.trade_project_photos
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.worker_profiles wp
    WHERE wp.id = worker_profile_id AND wp.user_id = auth.uid()
  ));
CREATE POLICY "Trade photos worker delete own" ON public.trade_project_photos
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.worker_profiles wp
    WHERE wp.id = worker_profile_id AND wp.user_id = auth.uid()
  ));
CREATE POLICY "Trade photos admin all" ON public.trade_project_photos
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================
-- FUNCTION: evaluate_trade_badge
-- Issues / refreshes a single badge for a worker+trade.
-- =========================================================
CREATE OR REPLACE FUNCTION public.evaluate_trade_badge(p_worker_profile_id UUID, p_trade_slug TEXT)
RETURNS public.trade_badges
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quiz_id UUID;
  v_passing_attempt RECORD;
  v_verified_refs INT;
  v_reviewed_photos INT;
  v_existing RECORD;
  v_result public.trade_badges;
BEGIN
  -- Look up matching quiz by slug
  SELECT id INTO v_quiz_id FROM public.quizzes WHERE slug = p_trade_slug AND is_active = true;
  IF v_quiz_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Condition 1: passed quiz attempt within last 12 months
  SELECT * INTO v_passing_attempt
  FROM public.quiz_attempts
  WHERE worker_profile_id = p_worker_profile_id
    AND quiz_id = v_quiz_id
    AND result = 'passed'
    AND submitted_at >= now() - interval '12 months'
  ORDER BY submitted_at DESC
  LIMIT 1;

  -- Condition 2: at least 3 verified refs with completion within last 6 months
  SELECT COUNT(*) INTO v_verified_refs
  FROM public.trade_references tr
  JOIN public.worker_references wr ON wr.id = tr.worker_reference_id
  WHERE wr.worker_profile_id = p_worker_profile_id
    AND tr.trade_slug = p_trade_slug
    AND tr.verified_at IS NOT NULL
    AND tr.job_completion_date >= (now() - interval '6 months')::date;

  -- Condition 3: at least 9 reviewed photos
  SELECT COUNT(*) INTO v_reviewed_photos
  FROM public.trade_project_photos
  WHERE worker_profile_id = p_worker_profile_id
    AND trade_slug = p_trade_slug
    AND reviewed_at IS NOT NULL;

  -- Existing row, if any
  SELECT * INTO v_existing
  FROM public.trade_badges
  WHERE worker_profile_id = p_worker_profile_id AND trade_slug = p_trade_slug;

  -- All conditions met → upsert/reactivate
  IF v_passing_attempt.id IS NOT NULL AND v_verified_refs >= 3 AND v_reviewed_photos >= 9 THEN
    IF v_existing.id IS NULL THEN
      INSERT INTO public.trade_badges
        (worker_profile_id, trade_slug, status, issued_at, expires_at, quiz_attempt_id)
      VALUES
        (p_worker_profile_id, p_trade_slug, 'active', now(), now() + interval '12 months', v_passing_attempt.id)
      RETURNING * INTO v_result;
      RETURN v_result;
    ELSIF v_existing.status = 'expired' THEN
      UPDATE public.trade_badges
      SET status = 'active',
          issued_at = now(),
          expires_at = now() + interval '12 months',
          quiz_attempt_id = v_passing_attempt.id,
          revoked_at = NULL,
          revoked_by = NULL,
          revocation_reason = NULL
      WHERE id = v_existing.id
      RETURNING * INTO v_result;
      RETURN v_result;
    ELSE
      -- active or revoked: leave alone (active stays valid; revoked needs admin action)
      RETURN v_existing;
    END IF;
  END IF;

  -- Conditions not all met: leave existing badge alone (active badges stay valid until expiry)
  RETURN v_existing;
END;
$$;

GRANT EXECUTE ON FUNCTION public.evaluate_trade_badge(UUID, TEXT) TO authenticated;

-- =========================================================
-- FUNCTION: refresh_all_trade_badges_for_worker
-- =========================================================
CREATE OR REPLACE FUNCTION public.refresh_all_trade_badges_for_worker(p_worker_profile_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug TEXT;
BEGIN
  FOR v_slug IN SELECT slug FROM public.trades LOOP
    PERFORM public.evaluate_trade_badge(p_worker_profile_id, v_slug);
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_all_trade_badges_for_worker(UUID) TO authenticated;

-- =========================================================
-- FUNCTION: expire_old_badges
-- TODO: schedule via Supabase cron daily at 03:00 UTC: '0 3 * * *'
-- Example: SELECT cron.schedule('expire-trade-badges', '0 3 * * *', $$SELECT public.expire_old_badges();$$);
-- =========================================================
CREATE OR REPLACE FUNCTION public.expire_old_badges()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE public.trade_badges
  SET status = 'expired'
  WHERE status = 'active' AND expires_at < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- =========================================================
-- TRIGGER: auto-issue badge after a passing quiz attempt
-- =========================================================
CREATE OR REPLACE FUNCTION public.trg_quiz_attempt_evaluate_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug TEXT;
BEGIN
  IF NEW.result = 'passed' THEN
    SELECT slug INTO v_slug FROM public.quizzes WHERE id = NEW.quiz_id;
    IF v_slug IS NOT NULL THEN
      PERFORM public.evaluate_trade_badge(NEW.worker_profile_id, v_slug);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER quiz_attempts_evaluate_badge
AFTER INSERT OR UPDATE OF result ON public.quiz_attempts
FOR EACH ROW EXECUTE FUNCTION public.trg_quiz_attempt_evaluate_badge();

-- =========================================================
-- TRIGGER: refresh badges when a trade reference gets verified
-- =========================================================
CREATE OR REPLACE FUNCTION public.trg_trade_ref_refresh_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_worker_id UUID;
BEGIN
  IF NEW.verified_at IS DISTINCT FROM OLD.verified_at THEN
    SELECT wp.id INTO v_worker_id
    FROM public.worker_references wr
    JOIN public.worker_profiles wp ON wp.id = wr.worker_profile_id
    WHERE wr.id = NEW.worker_reference_id;
    IF v_worker_id IS NOT NULL THEN
      PERFORM public.refresh_all_trade_badges_for_worker(v_worker_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trade_references_refresh_badges
AFTER UPDATE OF verified_at ON public.trade_references
FOR EACH ROW EXECUTE FUNCTION public.trg_trade_ref_refresh_badges();

-- =========================================================
-- TRIGGER: refresh badges when a trade photo gets reviewed
-- =========================================================
CREATE OR REPLACE FUNCTION public.trg_trade_photo_refresh_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at THEN
    PERFORM public.refresh_all_trade_badges_for_worker(NEW.worker_profile_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trade_project_photos_refresh_badges
AFTER UPDATE OF reviewed_at ON public.trade_project_photos
FOR EACH ROW EXECUTE FUNCTION public.trg_trade_photo_refresh_badges();
