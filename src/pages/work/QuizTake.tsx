import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { workerNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { quizDb } from "@/lib/quiz-db";
import { Loader2, Clock } from "lucide-react";
import { toast } from "sonner";

type QuizQuestion = {
  id: string;
  position: number;
  stem: string;
  options: { label: string; text: string }[];
};

type StartResponse = {
  attempt_id: string;
  quiz_id: string;
  time_limit_minutes: number;
  questions: QuizQuestion[];
  resumed?: boolean;
};

const QuizTake = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StartResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState<null | (() => void)>(null);
  const [now, setNow] = useState(() => Date.now());
  const startedRef = useRef<number | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: rpcData, error: rpcError } = await quizDb.rpc("start_quiz_attempt", {
        p_quiz_slug: slug,
      });
      if (rpcError) {
        setError(rpcError.message);
        setLoading(false);
        return;
      }
      const payload = rpcData as StartResponse;
      setData(payload);
      startedRef.current = Date.now();
      setLoading(false);
    })();
  }, [slug]);

  // Countdown ticker
  useEffect(() => {
    if (!data) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [data]);

  const deadline = useMemo(() => {
    if (!data || !startedRef.current) return null;
    return startedRef.current + data.time_limit_minutes * 60 * 1000;
  }, [data]);

  const remainingMs = deadline ? Math.max(0, deadline - now) : 0;
  const remainingMin = Math.floor(remainingMs / 60000);
  const remainingSec = Math.floor((remainingMs % 60000) / 1000);

  const handleSubmit = async (auto = false) => {
    if (!data || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const { data: result, error: rpcErr } = await quizDb.rpc("submit_quiz_attempt", {
        p_attempt_id: data.attempt_id,
        p_answers: answers,
      });
      if (rpcErr) throw rpcErr;
      if (auto) toast.message("Time's up — quiz auto-submitted");
      navigate(`/work/quizzes/${slug}/result/${data.attempt_id}`, { state: { result } });
    } catch (e) {
      submittedRef.current = false;
      toast.error(e instanceof Error ? e.message : "Submission failed");
      setSubmitting(false);
    }
  };

  // Auto-submit on time-up
  useEffect(() => {
    if (!data || !deadline) return;
    if (remainingMs <= 0 && !submittedRef.current) {
      handleSubmit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs, data, deadline]);

  // Warn before navigation away (browser-level)
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (submittedRef.current || !data) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [data]);

  if (loading) {
    return (
      <AppLayout role="worker" nav={workerNav}>
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout role="worker" nav={workerNav}>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-5 max-w-2xl">
          <p className="font-bold mb-1">Couldn't start this quiz</p>
          <p className="text-sm">{error ?? "Unknown error"}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/work/quizzes")}>
            Back to quizzes
          </Button>
        </div>
      </AppLayout>
    );
  }

  const total = data.questions.length;
  const q = data.questions[currentIdx];
  const isLast = currentIdx === total - 1;
  const answeredCount = Object.keys(answers).filter((k) => answers[k]).length;

  const tryNavigate = (fn: () => void) => {
    if (submittedRef.current) {
      fn();
      return;
    }
    setConfirmLeave(() => fn);
  };

  return (
    <AppLayout role="worker" nav={workerNav}>
      <div className="max-w-3xl">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="eyebrow">Trade quiz</span>
            <h1 className="display-md text-2xl mt-1">
              Question {currentIdx + 1} of {total}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm font-mono rounded-md border border-border bg-card px-3 py-2">
            <Clock className="h-4 w-4" />
            <span className={remainingMs < 60_000 ? "text-destructive font-bold" : ""}>
              {String(remainingMin).padStart(2, "0")}:{String(remainingSec).padStart(2, "0")}
            </span>
          </div>
        </div>

        <Progress value={((currentIdx + 1) / total) * 100} className="mb-6" />

        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-base mb-5 leading-relaxed font-medium">{q.stem}</p>
          <RadioGroup
            value={answers[q.id] ?? ""}
            onValueChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
          >
            <div className="space-y-2">
              {q.options.map((opt) => (
                <Label
                  key={opt.label}
                  htmlFor={`${q.id}-${opt.label}`}
                  className="flex items-start gap-3 rounded-md border border-border bg-background p-3 cursor-pointer hover:border-primary/40"
                >
                  <RadioGroupItem id={`${q.id}-${opt.label}`} value={opt.label} className="mt-0.5" />
                  <span className="text-sm leading-relaxed">
                    <span className="font-bold mr-2">{opt.label}.</span>
                    {opt.text}
                  </span>
                </Label>
              ))}
            </div>
          </RadioGroup>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          >
            Previous
          </Button>
          <p className="text-xs text-muted-foreground">
            {answeredCount} of {total} answered
          </p>
          {isLast ? (
            <Button onClick={() => handleSubmit(false)} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit quiz
            </Button>
          ) : (
            <Button onClick={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))}>Next</Button>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => tryNavigate(() => navigate("/work/quizzes"))}>
            Save & exit
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmLeave !== null} onOpenChange={(open) => !open && setConfirmLeave(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave the quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              Your answers so far are not saved until you submit. The countdown keeps running, and this counts as one of your three attempts. Come back to resume.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const fn = confirmLeave;
                setConfirmLeave(null);
                if (fn) fn();
              }}
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default QuizTake;
