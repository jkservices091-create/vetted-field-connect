-- Quizzes (one row per trade)
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  passing_score INTEGER NOT NULL DEFAULT 16,
  total_questions INTEGER NOT NULL DEFAULT 20,
  time_limit_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quiz questions (correct_choice + explanation are sensitive)
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  choice_a TEXT NOT NULL,
  choice_b TEXT NOT NULL,
  choice_c TEXT NOT NULL,
  choice_d TEXT NOT NULL,
  correct_choice CHAR(1) NOT NULL CHECK (correct_choice IN ('A','B','C','D')),
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (quiz_id, position)
);

-- Worker attempts
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_profile_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  quiz_version INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  score INTEGER,
  passed BOOLEAN,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_quiz_attempts_worker ON public.quiz_attempts(worker_profile_id);
CREATE INDEX idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);

-- Earned qualifications
CREATE TABLE public.worker_trade_qualifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_profile_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  trade_slug TEXT NOT NULL,
  quiz_version INTEGER NOT NULL,
  score INTEGER NOT NULL,
  passed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (worker_profile_id, trade_slug)
);

-- Updated-at triggers
CREATE TRIGGER update_quizzes_updated_at
BEFORE UPDATE ON public.quizzes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_trade_qualifications ENABLE ROW LEVEL SECURITY;

-- quizzes: public read of active, admin manage
CREATE POLICY "Quizzes public view active" ON public.quizzes
FOR SELECT USING (is_active = true OR public.is_admin(auth.uid()));

CREATE POLICY "Quizzes admin all" ON public.quizzes
FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- quiz_questions: select allowed (we'll hide correct answer via a safe view in client code), admin manage
CREATE POLICY "Quiz questions admin all" ON public.quiz_questions
FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- quiz_attempts: worker owns
CREATE POLICY "QA worker view own" ON public.quiz_attempts
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.worker_profiles wp
          WHERE wp.id = quiz_attempts.worker_profile_id AND wp.user_id = auth.uid())
  OR public.is_admin(auth.uid())
);
CREATE POLICY "QA worker insert" ON public.quiz_attempts
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.worker_profiles wp
          WHERE wp.id = quiz_attempts.worker_profile_id AND wp.user_id = auth.uid())
);
CREATE POLICY "QA admin all" ON public.quiz_attempts
FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- worker_trade_qualifications: public read (so hirers see), worker view own, admin manage
CREATE POLICY "WTQ viewable by everyone" ON public.worker_trade_qualifications
FOR SELECT USING (true);
CREATE POLICY "WTQ admin all" ON public.worker_trade_qualifications
FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Public-safe view that hides correct_choice and explanation (used by clients)
CREATE OR REPLACE VIEW public.quiz_questions_public AS
SELECT id, quiz_id, position, prompt, choice_a, choice_b, choice_c, choice_d
FROM public.quiz_questions;

GRANT SELECT ON public.quiz_questions_public TO anon, authenticated;

-- Lock down direct table reads of quiz_questions to admins only (no public select policy)
-- (already handled: only the admin-all policy exists, so non-admins cannot SELECT directly)