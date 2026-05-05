import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { workerNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { quizDb } from "@/lib/quiz-db";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, GraduationCap, ArrowRight } from "lucide-react";
import { format, addDays } from "date-fns";

type Quiz = {
  id: string;
  slug: string;
  title: string;
  passing_score: number;
  time_limit_minutes: number;
};

type Attempt = {
  id: string;
  quiz_id: string;
  result: "passed" | "failed" | "in_progress";
  score: number | null;
  submitted_at: string | null;
  started_at: string;
};

type QuizState = {
  quiz: Quiz;
  attempts: Attempt[];
  passed?: Attempt;
  inProgress?: Attempt;
  lastFailed?: Attempt;
  bestScore: number | null;
};

const Quizzes = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState<QuizState[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: quizzes } = await quizDb.from("quizzes")
        .select("id, slug, title, passing_score, time_limit_minutes")
        .eq("is_active", true)
        .order("title");

      const { data: wp } = await supabase
        .from("worker_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let attempts: Attempt[] = [];
      if (wp) {
        const { data } = await quizDb.from("quiz_attempts")
          .select("id, quiz_id, result, score, submitted_at, started_at")
          .eq("worker_profile_id", wp.id);
        attempts = (data ?? []) as Attempt[];
      }

      const next: QuizState[] = (quizzes ?? []).map((q: Quiz) => {
        const mine = attempts.filter((a) => a.quiz_id === q.id);
        const passed = mine.find((a) => a.result === "passed");
        const inProgress = mine.find((a) => a.result === "in_progress");
        const failed = mine
          .filter((a) => a.result === "failed")
          .sort((a, b) => (b.submitted_at ?? "").localeCompare(a.submitted_at ?? ""));
        const scores = mine.map((a) => a.score).filter((s): s is number => typeof s === "number");
        return {
          quiz: q,
          attempts: mine,
          passed,
          inProgress,
          lastFailed: failed[0],
          bestScore: scores.length ? Math.max(...scores) : null,
        };
      });

      setStates(next);
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <AppLayout role="worker" nav={workerNav}>
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="worker" nav={workerNav}>
      <PageHeader
        eyebrow="Trade quizzes"
        title="Prove what you know"
        description="20 questions per trade. Pass with 16+ to mark the trade on your profile. Three attempts per quiz, with a 7-day wait between tries."
      />

      {states.length === 0 ? (
        <EmptyState title="No quizzes available" description="Quizzes will appear here once they're seeded." />
      ) : (
        <div className="grid gap-3">
          {states.map((s) => (
            <QuizRow key={s.quiz.id} state={s} />
          ))}
        </div>
      )}
    </AppLayout>
  );
};

function QuizRow({ state }: { state: QuizState }) {
  const { quiz, passed, inProgress, lastFailed, bestScore, attempts } = state;

  const retryDate =
    lastFailed?.submitted_at && !passed && !inProgress
      ? addDays(new Date(lastFailed.submitted_at), 7)
      : null;
  const lockedUntilRetry = retryDate ? retryDate > new Date() : false;
  const attemptsUsed = attempts.filter((a) => a.result !== "in_progress").length;

  let status: { label: string; tone: "passed" | "failed" | "progress" | "idle" } = { label: "Not started", tone: "idle" };
  if (passed && passed.submitted_at) {
    status = { label: `Passed on ${format(new Date(passed.submitted_at), "MMM d, yyyy")}`, tone: "passed" };
  } else if (inProgress) {
    status = { label: "In progress", tone: "progress" };
  } else if (lastFailed && lockedUntilRetry && retryDate) {
    status = { label: `Failed — retry available ${format(retryDate, "MMM d, yyyy")}`, tone: "failed" };
  } else if (lastFailed) {
    status = { label: "Failed — retry now", tone: "failed" };
  }

  const buttonLabel = passed ? "View result" : inProgress ? "Resume quiz" : attempts.length > 0 ? "Retake quiz" : "Take quiz";
  const buttonHref = passed
    ? `/work/quizzes/${quiz.slug}/result/${passed.id}`
    : inProgress
    ? `/work/quizzes/${quiz.slug}`
    : `/work/quizzes/${quiz.slug}`;

  const buttonDisabled = !passed && !inProgress && (lockedUntilRetry || attemptsUsed >= 3);

  return (
    <Card className="hover:border-primary/50 transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <GraduationCap className="h-5 w-5 text-primary mt-1" />
            <div>
              <CardTitle className="text-lg">{quiz.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Pass with {quiz.passing_score} / 20 · {quiz.time_limit_minutes} min · Attempts used: {attemptsUsed} / 3
              </p>
            </div>
          </div>
          <StatusBadge tone={status.tone} label={status.label} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">
            {bestScore !== null ? `Best score: ${bestScore} / 20` : "No attempts yet"}
          </p>
          {buttonDisabled ? (
            <Button variant="outline" size="sm" disabled>
              {attemptsUsed >= 3 ? "Attempt limit reached" : "Locked"}
            </Button>
          ) : (
            <Button asChild size="sm" variant={passed ? "outline" : "default"}>
              <Link to={buttonHref}>
                {buttonLabel} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ tone, label }: { tone: "passed" | "failed" | "progress" | "idle"; label: string }) {
  const className =
    tone === "passed"
      ? "bg-success/15 text-success border-success/30"
      : tone === "failed"
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : tone === "progress"
      ? "bg-warning/15 text-warning-foreground border-warning/30"
      : "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

export default Quizzes;
