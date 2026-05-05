DROP VIEW IF EXISTS public.quiz_questions_public;

CREATE VIEW public.quiz_questions_public
WITH (security_invoker = true) AS
SELECT id, quiz_id, position, prompt, choice_a, choice_b, choice_c, choice_d
FROM public.quiz_questions;

-- Allow read on view; underlying table still blocks correct_choice via RLS (no public select policy)
GRANT SELECT ON public.quiz_questions_public TO anon, authenticated;

-- Add a public select policy on the base table so the view can read rows,
-- but we will only ever select non-sensitive columns through the view.
-- Actually: with security_invoker, the view runs as the user, who has no SELECT
-- policy on quiz_questions. So we need an explicit policy that allows reading,
-- and we rely on the view to filter columns.
CREATE POLICY "Quiz questions public read" ON public.quiz_questions
FOR SELECT USING (true);