import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { workerNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { quizDb } from "@/lib/quiz-db";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { format, addDays } from "date-fns";

type Breakdown = {
  question_id: string;
  position: number;
  stem: string;
  your_answer: string;
  correct_option: string;
  is_correct: boolean;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  explanation: string | null;
};

type ResultPayload = {
  score: number;
  total: number;
  passing_score: number;
  result: "passed" | "failed";
  breakdown: Breakdown[];
};

const QuizResult = () => {
  const { slug, attemptId } = useParams<{ slug: string; attemptId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const stateResult = (location.state as { result?: ResultPayload } | null)?.result ?? null;

  const [loading, setLoading] = useState(!stateResult);
  const [result, setResult] = useState<ResultPayload | null>(stateResult);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!attemptId) return;
      const { data: attempt, error: attErr } = await quizDb.from("quiz_attempts")
        .select("id, submitted_at, result, score, answers")
        .eq("id", attemptId)
        .maybeSingle();
      if (attErr || !attempt) {
        setError("Couldn't load this attempt.");
        setLoading(false);
        return;
      }
      setSubmittedAt(attempt.submitted_at);
      if (!result && attempt.result !== "in_progress") {
        // Re-derive breakdown by calling submit isn't possible (already submitted).
        // We instead query questions via the public view and compute pass/fail visuals.
        // Since the table is admin-only for the answer, we just show their answers and
        // pass/fail summary. The full breakdown is shown when arriving via take->submit.
        const { data: quiz } = await quizDb.from("quizzes")
          .select("id, passing_score")
          .eq("slug", slug)
          .maybeSingle();
        if (quiz) {
          const { data: qs } = await quizDb.from("quiz_questions_public")
            .select("id, position, stem, option_a, option_b, option_c, option_d")
            .eq("quiz_id", quiz.id)
            .order("position");
          const answers = (attempt.answers as Record<string, string>) ?? {};
          const breakdown: Breakdown[] = (qs ?? []).map((q: { id: string; position: number; stem: string; option_a: string; option_b: string; option_c: string; option_d: string }) => ({
            question_id: q.id,
            position: q.position,
            stem: q.stem,
            your_answer: (answers[q.id] ?? "").toUpperCase(),
            correct_option: "",
            is_correct: false,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            explanation: null,
          }));
          setResult({
            score: attempt.score ?? 0,
            total: 20,
            passing_score: quiz.passing_score,
            result: attempt.result,
            breakdown,
          });
        }
      }
      setLoading(false);
    })();
  }, [attemptId, slug, result]);

  if (loading) {
    return (
      <AppLayout role="worker" nav={workerNav}>
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (error || !result) {
    return (
      <AppLayout role="worker" nav={workerNav}>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-5 max-w-2xl">
          <p className="font-bold">{error ?? "Result unavailable"}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/work/quizzes")}>
            Back to quizzes
          </Button>
        </div>
      </AppLayout>
    );
  }

  const passed = result.result === "passed";
  const wrong = result.breakdown.filter((b) => !b.is_correct);
  const retryDate = !passed && submittedAt ? addDays(new Date(submittedAt), 7) : null;

  return (
    <AppLayout role="worker" nav={workerNav}>
      <div className="max-w-3xl">
        <div
          className={`rounded-lg border p-6 mb-6 flex items-start gap-4 ${
            passed
              ? "border-success/30 bg-success/10"
              : "border-destructive/30 bg-destructive/10"
          }`}
        >
          {passed ? (
            <CheckCircle2 className="h-8 w-8 text-success mt-1" />
          ) : (
            <XCircle className="h-8 w-8 text-destructive mt-1" />
          )}
          <div className="flex-1">
            <h1 className="display-md text-2xl">
              {passed ? "You passed!" : "Not quite — try again later"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Score: <span className="font-bold text-foreground">{result.score} / {result.total}</span>
              {" · "}Passing: {result.passing_score} / {result.total}
            </p>
            {!passed && retryDate && (
              <p className="text-sm mt-2">
                You can retake this quiz on <span className="font-bold">{format(retryDate, "MMM d, yyyy")}</span>.
              </p>
            )}
          </div>
        </div>

        {wrong.length > 0 && (
          <section className="mb-8">
            <h2 className="display-md text-xl mb-3">What you missed</h2>
            <div className="space-y-3">
              {wrong.map((b) => (
                <div key={b.question_id} className="rounded-lg border border-border bg-card p-5">
                  <p className="text-xs text-muted-foreground mb-1">Question {b.position}</p>
                  <p className="font-medium mb-3">{b.stem}</p>
                  <div className="text-sm space-y-1.5">
                    <p>
                      <span className="text-muted-foreground">Your answer:</span>{" "}
                      <span className="font-bold text-destructive">{b.your_answer || "(none)"}</span>
                    </p>
                    {b.correct_option && (
                      <p>
                        <span className="text-muted-foreground">Correct answer:</span>{" "}
                        <span className="font-bold text-success">{b.correct_option}</span>
                      </p>
                    )}
                  </div>
                  {b.explanation && (
                    <p className="text-sm mt-3 text-muted-foreground border-t border-border pt-3">
                      {b.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link to="/work/quizzes">Back to quizzes</Link>
          </Button>
          {!passed && retryDate && retryDate <= new Date() && (
            <Button asChild>
              <Link to={`/work/quizzes/${slug}`}>Retake quiz</Link>
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default QuizResult;
