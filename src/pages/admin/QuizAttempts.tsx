import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { adminNav } from "@/lib/nav";
import { supabase } from "@/integrations/supabase/client";
import { quizDb } from "@/lib/quiz-db";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type QuizRow = { id: string; slug: string; title: string };

type AttemptRow = {
  id: string;
  worker_profile_id: string;
  quiz_id: string;
  score: number | null;
  result: "passed" | "failed" | "in_progress";
  submitted_at: string | null;
  started_at: string;
  answers: Record<string, string>;
  workerName: string;
  quizTitle: string;
  quizSlug: string;
};

type BreakdownRow = {
  id: string;
  position: number;
  stem: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  worker_answer: string;
};

const QuizAttempts = () => {
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [filterQuiz, setFilterQuiz] = useState<string>("all");
  const [filterResult, setFilterResult] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [open, setOpen] = useState<AttemptRow | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownRow[] | null>(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: qs }, { data: ats }] = await Promise.all([
        quizDb.from("quizzes").select("id, slug, title").order("title"),
        quizDb.from("quiz_attempts")
          .select("id, worker_profile_id, quiz_id, score, result, submitted_at, started_at, answers")
          .order("submitted_at", { ascending: false, nullsFirst: false })
          .limit(500),
      ]);

      const quizMap: Record<string, QuizRow> = {};
      (qs ?? []).forEach((q: QuizRow) => (quizMap[q.id] = q));

      type AttemptRaw = AttemptRow & { worker_profile_id: string };
      const wpIds = Array.from(new Set((ats ?? []).map((a: AttemptRaw) => a.worker_profile_id)));
      const { data: wps } = await supabase
        .from("worker_profiles")
        .select("id, user_id")
        .in("id", wpIds);
      const userIds = (wps ?? []).map((w) => w.user_id);
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      const profMap: Record<string, string> = {};
      (profs ?? []).forEach((p) => (profMap[p.user_id] = p.full_name ?? "Worker"));
      const wpMap: Record<string, string> = {};
      (wps ?? []).forEach((w) => (wpMap[w.id] = profMap[w.user_id] ?? "Worker"));

      setQuizzes(qs ?? []);
      setAttempts(
        (ats ?? []).map((a: AttemptRaw) => ({
          ...a,
          workerName: wpMap[a.worker_profile_id] ?? "Worker",
          quizTitle: quizMap[a.quiz_id]?.title ?? "—",
          quizSlug: quizMap[a.quiz_id]?.slug ?? "",
        }))
      );
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return attempts.filter((a) => {
      if (filterQuiz !== "all" && a.quiz_id !== filterQuiz) return false;
      if (filterResult !== "all" && a.result !== filterResult) return false;
      const ts = a.submitted_at ?? a.started_at;
      if (from && ts < from) return false;
      if (to && ts > to + "T23:59:59") return false;
      return true;
    });
  }, [attempts, filterQuiz, filterResult, from, to]);

  const openAttempt = async (a: AttemptRow) => {
    setOpen(a);
    setBreakdown(null);
    setBreakdownLoading(true);
    const { data: qs } = await quizDb.from("quiz_questions")
      .select("id, position, stem, option_a, option_b, option_c, option_d, correct_option")
      .eq("quiz_id", a.quiz_id)
      .order("position");
    type RawQ = Omit<BreakdownRow, "worker_answer">;
    const rows: BreakdownRow[] = (qs ?? []).map((q: RawQ) => ({
      id: q.id,
      position: q.position,
      stem: q.stem,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
      worker_answer: (a.answers?.[q.id] ?? "").toUpperCase(),
    }));
    setBreakdown(rows);
    setBreakdownLoading(false);
  };

  if (loading) {
    return (
      <AppLayout role="admin" nav={adminNav}>
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="admin" nav={adminNav}>
      <PageHeader
        eyebrow="Quiz attempts"
        title="Worker quiz history"
        description={`${attempts.length} recent attempts across ${quizzes.length} quizzes.`}
      />

      <div className="grid sm:grid-cols-4 gap-3 mb-6">
        <div className="space-y-1.5">
          <Label className="text-xs">Quiz</Label>
          <Select value={filterQuiz} onValueChange={setFilterQuiz}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All quizzes</SelectItem>
              {quizzes.map((q) => (
                <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Result</Label>
          <Select value={filterResult} onValueChange={setFilterResult}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All results</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No attempts" description="No quiz attempts match these filters." />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Worker</TableHead>
                <TableHead>Quiz</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id} className="cursor-pointer" onClick={() => openAttempt(a)}>
                  <TableCell className="font-medium">{a.workerName}</TableCell>
                  <TableCell>{a.quizTitle}</TableCell>
                  <TableCell>{a.score !== null ? `${a.score} / 20` : "—"}</TableCell>
                  <TableCell>
                    <ResultBadge result={a.result} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {a.submitted_at ? format(new Date(a.submitted_at), "MMM d, yyyy h:mm a") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{open?.workerName} — {open?.quizTitle}</SheetTitle>
          </SheetHeader>
          {open && (
            <div className="mt-4 text-sm text-muted-foreground">
              Score: <span className="font-bold text-foreground">{open.score ?? "—"} / 20</span>
              {" · "}
              <ResultBadge result={open.result} />
              {open.submitted_at && (
                <> · Submitted {format(new Date(open.submitted_at), "MMM d, yyyy h:mm a")}</>
              )}
            </div>
          )}
          <div className="mt-6 space-y-3">
            {breakdownLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            {breakdown?.map((b) => {
              const correct = b.worker_answer === b.correct_option;
              return (
                <div
                  key={b.id}
                  className={`rounded-md border p-4 ${
                    correct ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
                  }`}
                >
                  <p className="text-xs text-muted-foreground mb-1">Question {b.position}</p>
                  <p className="text-sm font-medium mb-3">{b.stem}</p>
                  <ul className="space-y-1 text-sm">
                    {[
                      ["A", b.option_a],
                      ["B", b.option_b],
                      ["C", b.option_c],
                      ["D", b.option_d],
                    ].map(([letter, text]) => {
                      const isCorrect = letter === b.correct_option;
                      const isWorker = letter === b.worker_answer;
                      return (
                        <li
                          key={letter}
                          className={`px-2 py-1 rounded ${
                            isCorrect ? "bg-success/15" : isWorker ? "bg-destructive/15" : ""
                          }`}
                        >
                          <span className="font-bold mr-2">{letter}.</span>
                          {text}
                          {isCorrect && <span className="ml-2 text-success font-bold">✓ correct</span>}
                          {isWorker && !isCorrect && (
                            <span className="ml-2 text-destructive font-bold">— worker chose this</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
};

function ResultBadge({ result }: { result: "passed" | "failed" | "in_progress" }) {
  const map = {
    passed: "bg-success/15 text-success border-success/30",
    failed: "bg-destructive/15 text-destructive border-destructive/30",
    in_progress: "bg-muted text-muted-foreground border-border",
  } as const;
  const label = result === "in_progress" ? "In progress" : result;
  return (
    <Badge variant="outline" className={map[result]}>
      {label}
    </Badge>
  );
}

export default QuizAttempts;
