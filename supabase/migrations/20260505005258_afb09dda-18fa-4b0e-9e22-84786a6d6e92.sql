DROP POLICY IF EXISTS "Quiz questions public read" ON public.quiz_questions;
DROP VIEW IF EXISTS public.quiz_questions_public;

CREATE OR REPLACE FUNCTION public.get_quiz_questions(_quiz_id uuid)
RETURNS TABLE (
  q_id uuid,
  q_position int,
  prompt text,
  choice_a text,
  choice_b text,
  choice_c text,
  choice_d text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.id, q.position, q.prompt, q.choice_a, q.choice_b, q.choice_c, q.choice_d
  FROM public.quiz_questions q
  WHERE q.quiz_id = _quiz_id
  ORDER BY q.position;
$$;

REVOKE EXECUTE ON FUNCTION public.get_quiz_questions(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_quiz_questions(uuid) TO authenticated;