import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { workerNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, GraduationCap, Lock } from "lucide-react";

type Quiz = {
  id: string;
  trade_slug: string;
  title: string;
  passing_score: number;
  total_questions: number;
  time_limit_minutes: number;
};

type Qual = { trade_slug: string; passed_at: string; score: number };

type Attempt = { quiz_id: string; submitted_at: string | null; passed: boolean | null };

const Quizzes = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quals, setQuals] = useState<Qual[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [workerProfileId, setWorkerProfileId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: qz } = await supabase
        .from("quizzes")
        .select("id, trade_slug, title, passing_score, total_questions, time_limit_minutes")
        .eq("is_active", true)
        .order("title");
      setQuizzes(qz ?? []);

      if (user) {
        const { data: wp } = await supabase
          .from("worker_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (wp) {
          setWorkerProfileId(wp.id);
          const [{ data: q }, { data: a }] = await Promise.all([
            supabase.from("worker_trade_qualifications").select("trade_slug, passed_at, score").eq("worker_profile_id", wp.id),
            supabase.from("quiz_attempts").select("quiz_id, submitted_at, passed").eq("worker_profile_id", wp.id).not("submitted_at", "is", null),
          ]);
          setQuals(q ?? []);
          setAttempts(a ?? []);
        }
      }
      setLoading(false);
    })();
  }, [user]);

  const passedSlugs = new Set(quals.map((q) => q.trade_slug));
  const recentByQuiz = new Map<string, Attempt[]>();
  for (const a of attempts) {
    if (!recentByQuiz.has(a.quiz_id)) recentByQuiz.set(a.quiz_id, []);
    recentByQuiz.get(a.quiz_id)!.push(a);
  }

  return (
    <AppLayout role="worker" nav={workerNav}>
      <PageHeader
        eyebrow="Trade qualifications"
        title="Placement quizzes"
        description="Pass the entrance quiz for any trade you want to take jobs in. 20 questions, 80% to pass, 30 min."
      />

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : !workerProfileId ? (
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="font-bold mb-2">Set up your worker profile first</p>
          <p className="text-sm text-muted-foreground mb-4">You need a profile before you can take placement quizzes.</p>
          <Button asChild><Link to="/work/profile">Go to profile</Link></Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((quiz) => {
            const passed = passedSlugs.has(quiz.trade_slug);
            const recent = recentByQuiz.get(quiz.id) ?? [];
            const recentSorted = recent.slice().sort((a, b) => (b.submitted_at ?? "").localeCompare(a.submitted_at ?? ""));
            const last = recentSorted[0];
            const ninetyAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
            const recent90 = recent.filter((a) => a.submitted_at && new Date(a.submitted_at).getTime() > ninetyAgo);
            const attemptsLeft = Math.max(0, 3 - recent90.length);
            let cooldownDays = 0;
            if (last && last.passed === false) {
              const ends = new Date(last.submitted_at!).getTime() + 7 * 24 * 60 * 60 * 1000;
              if (Date.now() < ends) cooldownDays = Math.ceil((ends - Date.now()) / (24 * 60 * 60 * 1000));
            }
            const locked = !passed && (attemptsLeft === 0 || cooldownDays > 0);

            return (
              <div key={quiz.id} className="rounded-lg border border-border bg-card p-5 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-bold text-lg leading-tight">{quiz.title}</h3>
                  {passed ? (
                    <Badge className="bg-success text-success-foreground shrink-0"><CheckCircle2 className="h-3 w-3 mr-1" /> Qualified</Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  {quiz.total_questions} questions · {quiz.passing_score}/{quiz.total_questions} to pass · {quiz.time_limit_minutes} min
                </p>
                <div className="mt-auto flex items-center justify-between gap-2">
                  {passed ? (
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link to={`/work/quizzes/${quiz.trade_slug}`}>Retake</Link>
                    </Button>
                  ) : locked ? (
                    <Button disabled size="sm" className="w-full" variant="outline">
                      <Lock className="h-3 w-3 mr-1" />
                      {cooldownDays > 0 ? `${cooldownDays}d cooldown` : "No attempts left"}
                    </Button>
                  ) : (
                    <Button asChild size="sm" className="w-full">
                      <Link to={`/work/quizzes/${quiz.trade_slug}`}>
                        <GraduationCap className="h-4 w-4 mr-1" /> Take quiz
                      </Link>
                    </Button>
                  )}
                </div>
                {!passed && last && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Last attempt: {last.passed ? "passed" : "failed"} · {attemptsLeft} of 3 attempts left (90d)
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default Quizzes;
