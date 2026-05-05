import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { workerNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, XCircle, Clock, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Quiz = {
  id: string;
  trade_slug: string;
  title: string;
  passing_score: number;
  total_questions: number;
  time_limit_minutes: number;
};

type Question = {
  q_id: string;
  q_position: number;
  prompt: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
};

type Result = {
  score: number;
  total: number;
  passing_score: number;
  passed: boolean;
  breakdown: Record<string, { selected: string | null; correct: string; right: boolean }>;
};

const QuizTake = () => {
  const { trade } = useParams<{ trade: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      if (!trade) return;
      const { data: qz, error } = await supabase
        .from("quizzes")
        .select("id, trade_slug, title, passing_score, total_questions, time_limit_minutes")
        .eq("trade_slug", trade)
        .eq("is_active", true)
        .maybeSingle();
      if (error || !qz) {
        toast.error("Quiz not found");
        navigate("/work/quizzes");
        return;
      }
      setQuiz(qz);

      const { data: qs, error: qErr } = await supabase.rpc("get_quiz_questions", { _quiz_id: qz.id });
      if (qErr || !qs) {
        toast.error("Failed to load questions");
        setLoading(false);
        return;
      }
      // Shuffle question order for this attempt
      const shuffled = [...qs].sort(() => Math.random() - 0.5);
      setQuestions(shuffled as Question[]);
      setSecondsLeft(qz.time_limit_minutes * 60);
      setLoading(false);
    })();
  }, [trade, navigate]);

  // Countdown
  useEffect(() => {
    if (secondsLeft === null || result) return;
    if (secondsLeft <= 0) {
      handleSubmit(true);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s ?? 0) - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, result]);

  const answeredCount = useMemo(() => Object.values(answers).filter(Boolean).length, [answers]);

  const handleSubmit = async (auto = false) => {
    if (!quiz) return;
    if (!auto && answeredCount < questions.length) {
      const proceed = confirm(`You haven't answered ${questions.length - answeredCount} question(s). Submit anyway?`);
      if (!proceed) return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("grade-quiz", {
        body: { quiz_id: quiz.id, answers },
      });
      if (error) throw error;
      if ((data as any).error) throw new Error((data as any).error);
      setResult(data as Result);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !quiz) {
    return (
      <AppLayout role="worker" nav={workerNav}>
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }

  if (result) {
    return (
      <AppLayout role="worker" nav={workerNav}>
        <PageHeader eyebrow="Quiz result" title={quiz.title} />
        <div className={`rounded-lg border p-6 mb-6 ${result.passed ? "border-success/30 bg-success/10" : "border-destructive/30 bg-destructive/10"}`}>
          <div className="flex items-center gap-3 mb-2">
            {result.passed ? <CheckCircle2 className="h-6 w-6 text-success" /> : <XCircle className="h-6 w-6 text-destructive" />}
            <h2 className="display-md text-2xl">{result.passed ? "Passed!" : "Not passed"}</h2>
          </div>
          <p className="text-lg">
            Score: <strong>{result.score} / {result.total}</strong> ({Math.round((result.score / result.total) * 100)}%) — needed {result.passing_score}
          </p>
          {result.passed ? (
            <p className="text-sm text-muted-foreground mt-2">You're now qualified to apply for {quiz.title} jobs.</p>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">You can retake this quiz after a 7-day cooldown (3 attempts per 90 days).</p>
          )}
        </div>
        <div className="space-y-3 mb-6">
          <h3 className="font-bold">Question breakdown</h3>
          {questions.map((q, idx) => {
            const b = result.breakdown[q.q_id];
            const selectedText = b?.selected ? (q as any)[`choice_${b.selected.toLowerCase()}`] : "(not answered)";
            const correctText = (q as any)[`choice_${b.correct.toLowerCase()}`];
            return (
              <div key={q.q_id} className={`rounded-md border p-4 ${b?.right ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}>
                <div className="flex items-start gap-2 mb-2">
                  {b?.right ? <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-1" /> : <XCircle className="h-4 w-4 text-destructive shrink-0 mt-1" />}
                  <p className="font-semibold text-sm">{idx + 1}. {q.prompt}</p>
                </div>
                <p className="text-xs text-muted-foreground ml-6">Your answer: {b?.selected ?? "—"}. {selectedText}</p>
                {!b?.right && <p className="text-xs ml-6 mt-1"><strong>Correct:</strong> {b?.correct}. {correctText}</p>}
              </div>
            );
          })}
        </div>
        <Button asChild><Link to="/work/quizzes"><ArrowLeft className="h-4 w-4 mr-1" /> Back to quizzes</Link></Button>
      </AppLayout>
    );
  }

  const mins = Math.floor((secondsLeft ?? 0) / 60);
  const secs = (secondsLeft ?? 0) % 60;

  return (
    <AppLayout role="worker" nav={workerNav}>
      <PageHeader
        eyebrow="Placement quiz"
        title={quiz.title}
        description={`${quiz.total_questions} questions · need ${quiz.passing_score} correct to pass`}
      />

      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border -mx-4 px-4 py-3 mb-6 flex items-center justify-between">
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          {mins}:{String(secs).padStart(2, "0")}
        </Badge>
        <span className="text-sm text-muted-foreground">{answeredCount} / {questions.length} answered</span>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6 max-w-3xl">
        {questions.map((q, idx) => (
          <div key={q.q_id} className="rounded-lg border border-border bg-card p-5">
            <p className="font-semibold mb-4">{idx + 1}. {q.prompt}</p>
            <RadioGroup
              value={answers[q.q_id] ?? ""}
              onValueChange={(v) => setAnswers((a) => ({ ...a, [q.q_id]: v }))}
            >
              {(["A", "B", "C", "D"] as const).map((letter) => (
                <div key={letter} className="flex items-start gap-3 py-1">
                  <RadioGroupItem value={letter} id={`${q.q_id}-${letter}`} className="mt-1" />
                  <Label htmlFor={`${q.q_id}-${letter}`} className="font-normal cursor-pointer flex-1">
                    <strong className="mr-2">{letter}.</strong>
                    {(q as any)[`choice_${letter.toLowerCase()}`]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}

        <div className="flex items-center gap-3 pb-12">
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit quiz
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/work/quizzes")}>Cancel</Button>
        </div>
      </form>
    </AppLayout>
  );
};

export default QuizTake;
