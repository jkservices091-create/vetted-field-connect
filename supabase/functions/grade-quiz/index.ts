// Grades a quiz attempt server-side and records qualification on pass.
// CORS + auth required.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COOLDOWN_DAYS = 7;
const MAX_ATTEMPTS_PER_90D = 3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing auth" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Identify the user from the JWT
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Not authenticated" }, 401);
    const userId = userData.user.id;

    const body = await req.json();
    const { quiz_id, answers } = body as { quiz_id: string; answers: Record<string, string> };
    if (!quiz_id || !answers || typeof answers !== "object") {
      return json({ error: "Bad request" }, 400);
    }

    // Worker profile
    const { data: wp, error: wpErr } = await supabase
      .from("worker_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (wpErr || !wp) return json({ error: "No worker profile" }, 400);

    // Quiz info
    const { data: quiz, error: quizErr } = await supabase
      .from("quizzes")
      .select("id, trade_slug, version, passing_score, total_questions, is_active")
      .eq("id", quiz_id)
      .maybeSingle();
    if (quizErr || !quiz || !quiz.is_active) return json({ error: "Quiz not found" }, 404);

    // Cooldown / attempt-cap check
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("quiz_attempts")
      .select("submitted_at, passed")
      .eq("worker_profile_id", wp.id)
      .eq("quiz_id", quiz_id)
      .not("submitted_at", "is", null)
      .gte("submitted_at", ninetyDaysAgo)
      .order("submitted_at", { ascending: false });

    const recentAttempts = recent ?? [];
    if (recentAttempts.length >= MAX_ATTEMPTS_PER_90D) {
      return json({ error: `You've reached ${MAX_ATTEMPTS_PER_90D} attempts in the last 90 days. Try again later.` }, 429);
    }
    if (recentAttempts.length > 0 && !recentAttempts[0].passed) {
      const last = new Date(recentAttempts[0].submitted_at!).getTime();
      const cooldownEnds = last + COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
      if (Date.now() < cooldownEnds) {
        const days = Math.ceil((cooldownEnds - Date.now()) / (24 * 60 * 60 * 1000));
        return json({ error: `Please wait ${days} more day(s) before retaking this quiz.` }, 429);
      }
    }

    // Already qualified? (idempotent — just re-pass returns success)
    // Grade
    const { data: questions, error: qErr } = await supabase
      .from("quiz_questions")
      .select("id, correct_choice")
      .eq("quiz_id", quiz_id);
    if (qErr || !questions) return json({ error: "Failed to load questions" }, 500);

    let score = 0;
    const breakdown: Record<string, { selected: string | null; correct: string; right: boolean }> = {};
    for (const q of questions) {
      const sel = answers[q.id] ?? null;
      const right = sel === q.correct_choice;
      if (right) score++;
      breakdown[q.id] = { selected: sel, correct: q.correct_choice, right };
    }
    const passed = score >= quiz.passing_score;

    // Insert attempt
    const { error: insErr } = await supabase.from("quiz_attempts").insert({
      worker_profile_id: wp.id,
      quiz_id: quiz.id,
      quiz_version: quiz.version,
      submitted_at: new Date().toISOString(),
      score,
      passed,
      answers,
    });
    if (insErr) return json({ error: insErr.message }, 500);

    // Grant qualification on pass
    if (passed) {
      await supabase
        .from("worker_trade_qualifications")
        .upsert({
          worker_profile_id: wp.id,
          trade_slug: quiz.trade_slug,
          quiz_version: quiz.version,
          score,
          passed_at: new Date().toISOString(),
        }, { onConflict: "worker_profile_id,trade_slug" });
    }

    return json({
      score,
      total: quiz.total_questions,
      passing_score: quiz.passing_score,
      passed,
      breakdown,
    });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
