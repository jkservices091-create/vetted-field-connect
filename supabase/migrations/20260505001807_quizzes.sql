-- =========================================================
-- QUIZZES — entrance trade quizzes for workers
-- =========================================================

-- ENUMS
CREATE TYPE public.quiz_attempt_result AS ENUM ('passed', 'failed', 'in_progress');

-- =========================================================
-- TABLE: quizzes
-- =========================================================
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  passing_score INT NOT NULL DEFAULT 16,
  time_limit_minutes INT NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER quizzes_set_updated_at BEFORE UPDATE ON public.quizzes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- TABLE: quiz_questions (full table — admins only)
-- =========================================================
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  position INT NOT NULL,
  stem TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A','B','C','D')),
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (quiz_id, position)
);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_quiz_questions_quiz ON public.quiz_questions(quiz_id, position);

-- =========================================================
-- VIEW: quiz_questions_public — workers see this (no answers)
-- =========================================================
CREATE VIEW public.quiz_questions_public
WITH (security_invoker = true) AS
SELECT id, quiz_id, position, stem, option_a, option_b, option_c, option_d
FROM public.quiz_questions;

-- =========================================================
-- TABLE: quiz_attempts
-- =========================================================
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id),
  quiz_version INT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  score INT,
  result public.quiz_attempt_result NOT NULL DEFAULT 'in_progress',
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  attempt_number INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_quiz_attempts_worker_quiz ON public.quiz_attempts(worker_profile_id, quiz_id);

-- =========================================================
-- RLS POLICIES — quizzes
-- =========================================================
CREATE POLICY "Quizzes viewable by authenticated"
  ON public.quizzes FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Quizzes admin all"
  ON public.quizzes FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================
-- RLS POLICIES — quiz_questions (admin-only direct access)
-- Workers go through the public view + RPCs only.
-- =========================================================
CREATE POLICY "Quiz questions admin all"
  ON public.quiz_questions FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Lock down the base table from authenticated; allow access to the safe view.
REVOKE ALL ON public.quiz_questions FROM authenticated;
GRANT SELECT ON public.quiz_questions_public TO authenticated;

-- =========================================================
-- RLS POLICIES — quiz_attempts
-- =========================================================
CREATE POLICY "QA worker view own"
  ON public.quiz_attempts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.worker_profiles wp
    WHERE wp.id = worker_profile_id AND wp.user_id = auth.uid()
  ));
CREATE POLICY "QA worker insert own"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.worker_profiles wp
    WHERE wp.id = worker_profile_id AND wp.user_id = auth.uid()
  ));
CREATE POLICY "QA worker update own"
  ON public.quiz_attempts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.worker_profiles wp
    WHERE wp.id = worker_profile_id AND wp.user_id = auth.uid()
  ));
CREATE POLICY "QA admin all"
  ON public.quiz_attempts FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================
-- FUNCTION: start_quiz_attempt
-- =========================================================
CREATE OR REPLACE FUNCTION public.start_quiz_attempt(p_quiz_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_worker_id UUID;
  v_quiz RECORD;
  v_existing_passed RECORD;
  v_existing_in_progress RECORD;
  v_recent_count INT;
  v_last_failed RECORD;
  v_retry_after TIMESTAMPTZ;
  v_attempt_number INT;
  v_attempt_id UUID;
  v_questions JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO v_worker_id
  FROM public.worker_profiles
  WHERE user_id = v_user_id;
  IF v_worker_id IS NULL THEN
    RAISE EXCEPTION 'Worker profile not found';
  END IF;

  SELECT * INTO v_quiz FROM public.quizzes WHERE slug = p_quiz_slug AND is_active = true;
  IF v_quiz.id IS NULL THEN
    RAISE EXCEPTION 'Quiz % not found or inactive', p_quiz_slug;
  END IF;

  -- Already passed? Return that attempt; no new one.
  SELECT * INTO v_existing_passed
  FROM public.quiz_attempts
  WHERE worker_profile_id = v_worker_id
    AND quiz_id = v_quiz.id
    AND result = 'passed'
  ORDER BY submitted_at DESC
  LIMIT 1;
  IF v_existing_passed.id IS NOT NULL THEN
    RAISE EXCEPTION 'You already passed this quiz on %', to_char(v_existing_passed.submitted_at, 'YYYY-MM-DD');
  END IF;

  -- If there's an in_progress attempt, return it (resume)
  SELECT * INTO v_existing_in_progress
  FROM public.quiz_attempts
  WHERE worker_profile_id = v_worker_id
    AND quiz_id = v_quiz.id
    AND result = 'in_progress'
  ORDER BY started_at DESC
  LIMIT 1;
  IF v_existing_in_progress.id IS NOT NULL THEN
    v_attempt_id := v_existing_in_progress.id;
    SELECT jsonb_agg(q ORDER BY (q->>'position')::int)
    INTO v_questions
    FROM (
      SELECT jsonb_build_object(
        'id', qq.id,
        'position', qq.position,
        'stem', qq.stem,
        'options', (
          SELECT jsonb_agg(jsonb_build_object('label', label, 'text', text) ORDER BY ord)
          FROM (
            SELECT label, text, random() AS ord
            FROM (VALUES
              ('A', qq.option_a),
              ('B', qq.option_b),
              ('C', qq.option_c),
              ('D', qq.option_d)
            ) AS opts(label, text)
          ) shuffled_opts
        )
      ) AS q
      FROM public.quiz_questions qq
      WHERE qq.quiz_id = v_quiz.id
    ) qs;

    RETURN jsonb_build_object(
      'attempt_id', v_attempt_id,
      'quiz_id', v_quiz.id,
      'time_limit_minutes', v_quiz.time_limit_minutes,
      'questions', v_questions,
      'resumed', true
    );
  END IF;

  -- Cooldown: 3 attempts in last 90 days max
  SELECT COUNT(*) INTO v_recent_count
  FROM public.quiz_attempts
  WHERE worker_profile_id = v_worker_id
    AND quiz_id = v_quiz.id
    AND started_at >= now() - interval '90 days'
    AND result IN ('passed', 'failed');
  IF v_recent_count >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 attempts in 90 days reached for this quiz';
  END IF;

  -- 7-day cooldown after a failed attempt
  SELECT * INTO v_last_failed
  FROM public.quiz_attempts
  WHERE worker_profile_id = v_worker_id
    AND quiz_id = v_quiz.id
    AND result = 'failed'
  ORDER BY submitted_at DESC
  LIMIT 1;
  IF v_last_failed.id IS NOT NULL AND v_last_failed.submitted_at > now() - interval '7 days' THEN
    v_retry_after := v_last_failed.submitted_at + interval '7 days';
    RAISE EXCEPTION 'You can retry this quiz on %', to_char(v_retry_after, 'YYYY-MM-DD');
  END IF;

  -- Compute next attempt number
  SELECT COALESCE(MAX(attempt_number), 0) + 1 INTO v_attempt_number
  FROM public.quiz_attempts
  WHERE worker_profile_id = v_worker_id AND quiz_id = v_quiz.id;

  -- Create attempt
  INSERT INTO public.quiz_attempts (worker_profile_id, quiz_id, quiz_version, attempt_number, result)
  VALUES (v_worker_id, v_quiz.id, v_quiz.version, v_attempt_number, 'in_progress')
  RETURNING id INTO v_attempt_id;

  -- Build shuffled questions w/ shuffled options
  SELECT jsonb_agg(q ORDER BY q_ord)
  INTO v_questions
  FROM (
    SELECT random() AS q_ord,
      jsonb_build_object(
        'id', qq.id,
        'position', qq.position,
        'stem', qq.stem,
        'options', (
          SELECT jsonb_agg(jsonb_build_object('label', label, 'text', text) ORDER BY ord)
          FROM (
            SELECT label, text, random() AS ord
            FROM (VALUES
              ('A', qq.option_a),
              ('B', qq.option_b),
              ('C', qq.option_c),
              ('D', qq.option_d)
            ) AS opts(label, text)
          ) shuffled_opts
        )
      ) AS q
    FROM public.quiz_questions qq
    WHERE qq.quiz_id = v_quiz.id
  ) qs;

  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'quiz_id', v_quiz.id,
    'time_limit_minutes', v_quiz.time_limit_minutes,
    'questions', v_questions,
    'resumed', false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_quiz_attempt(TEXT) TO authenticated;

-- =========================================================
-- FUNCTION: submit_quiz_attempt
-- =========================================================
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(p_attempt_id UUID, p_answers JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_attempt RECORD;
  v_quiz RECORD;
  v_score INT := 0;
  v_total INT;
  v_result public.quiz_attempt_result;
  v_breakdown JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT a.*, wp.user_id AS owner_user_id
  INTO v_attempt
  FROM public.quiz_attempts a
  JOIN public.worker_profiles wp ON wp.id = a.worker_profile_id
  WHERE a.id = p_attempt_id;

  IF v_attempt.id IS NULL THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;
  IF v_attempt.owner_user_id <> v_user_id THEN
    RAISE EXCEPTION 'Not your attempt';
  END IF;
  IF v_attempt.result <> 'in_progress' THEN
    RAISE EXCEPTION 'Attempt already submitted';
  END IF;

  SELECT * INTO v_quiz FROM public.quizzes WHERE id = v_attempt.quiz_id;

  -- Score: count correct
  SELECT COUNT(*)::INT, COUNT(*) FILTER (
    WHERE upper(p_answers->>qq.id::text) = qq.correct_option
  )::INT
  INTO v_total, v_score
  FROM public.quiz_questions qq
  WHERE qq.quiz_id = v_attempt.quiz_id;

  v_result := CASE WHEN v_score >= v_quiz.passing_score THEN 'passed'::public.quiz_attempt_result
                   ELSE 'failed'::public.quiz_attempt_result END;

  UPDATE public.quiz_attempts
  SET answers = p_answers,
      score = v_score,
      submitted_at = now(),
      result = v_result
  WHERE id = p_attempt_id;

  -- Build per-question breakdown. Only attach explanation for wrong answers.
  SELECT jsonb_agg(jsonb_build_object(
    'question_id', qq.id,
    'position', qq.position,
    'stem', qq.stem,
    'your_answer', upper(COALESCE(p_answers->>qq.id::text, '')),
    'correct_option', qq.correct_option,
    'is_correct', upper(COALESCE(p_answers->>qq.id::text, '')) = qq.correct_option,
    'option_a', qq.option_a,
    'option_b', qq.option_b,
    'option_c', qq.option_c,
    'option_d', qq.option_d,
    'explanation', CASE
      WHEN upper(COALESCE(p_answers->>qq.id::text, '')) = qq.correct_option THEN NULL
      ELSE qq.explanation
    END
  ) ORDER BY qq.position)
  INTO v_breakdown
  FROM public.quiz_questions qq
  WHERE qq.quiz_id = v_attempt.quiz_id;

  RETURN jsonb_build_object(
    'score', v_score,
    'total', v_total,
    'passing_score', v_quiz.passing_score,
    'result', v_result,
    'breakdown', v_breakdown
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(UUID, JSONB) TO authenticated;
