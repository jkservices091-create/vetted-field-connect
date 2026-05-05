/**
 * Seed quizzes from the markdown files in /quizzes into Supabase.
 *
 * Reads each `quizzes/<slug>.md` (worker-facing question bank) and the
 * matching `quizzes/answer-keys/<slug>-key.md` (correct letter + explanation),
 * upserts a row in `public.quizzes`, and replaces all `quiz_questions` rows
 * for the quiz. Bumps `quizzes.version` if the question content changed.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... VITE_SUPABASE_URL=... npm run seed:quizzes
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUIZ_DIR = join(__dirname, "..", "quizzes");
const KEY_DIR = join(QUIZ_DIR, "answer-keys");

export type ParsedQuestion = {
  position: number;
  stem: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
};

export type ParsedAnswer = {
  position: number;
  correct_option: "A" | "B" | "C" | "D";
  explanation: string;
};

export type ParsedQuiz = {
  slug: string;
  title: string;
  questions: ParsedQuestion[];
  answers: ParsedAnswer[];
};

/**
 * Parses a quiz markdown file. Expected format per question:
 *
 *   1. Question stem here
 *      A. option text
 *      B. option text
 *      C. option text
 *      D. option text
 *
 * The title is taken from the first `# ` heading, with the trailing
 * "— Entrance Quiz" stripped.
 */
export function parseQuizMarkdown(md: string): { title: string; questions: ParsedQuestion[] } {
  const lines = md.split(/\r?\n/);
  let title = "";
  for (const line of lines) {
    const m = /^#\s+(.+?)\s*$/.exec(line);
    if (m) {
      title = m[1].replace(/\s*[—–-]\s*Entrance Quiz\s*$/i, "").trim();
      break;
    }
  }

  const questions: ParsedQuestion[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const qMatch = /^(\d+)\.\s+(.+)$/.exec(line);
    // Distinguish a question stem from an answer-key line: in the quiz file,
    // a question stem is followed by indented option lines (A.–D.). The next
    // few lines must contain the four options.
    if (qMatch) {
      const position = parseInt(qMatch[1], 10);
      // Accumulate the stem, which may span several lines, until we hit the A. option.
      let stem = qMatch[2].trim();
      let j = i + 1;
      const options: Record<string, string> = {};
      const optionRe = /^\s+([A-D])\.\s+(.+)$/;
      // Continuation lines for the stem (indented, not matching A./B./C./D.)
      while (j < lines.length) {
        const next = lines[j];
        if (optionRe.test(next)) break;
        if (/^\s*$/.test(next)) {
          // Blank line — assume stem is complete only if no options yet seen
          if (Object.keys(options).length > 0) break;
        } else if (/^\d+\.\s+/.test(next) || /^#\s+/.test(next) || /^---\s*$/.test(next)) {
          break;
        } else {
          stem += " " + next.trim();
        }
        j++;
      }
      // Now collect the four options.
      while (j < lines.length) {
        const m = optionRe.exec(lines[j]);
        if (!m) {
          if (/^\s*$/.test(lines[j])) {
            j++;
            continue;
          }
          break;
        }
        const label = m[1];
        let text = m[2].trim();
        // Option text may continue on subsequent indented continuation lines.
        let k = j + 1;
        while (k < lines.length) {
          const nxt = lines[k];
          if (optionRe.test(nxt) || /^\d+\.\s+/.test(nxt) || /^---\s*$/.test(nxt) || /^#\s+/.test(nxt) || /^\s*$/.test(nxt)) {
            break;
          }
          text += " " + nxt.trim();
          k++;
        }
        options[label] = text;
        j = k;
        if (options.A && options.B && options.C && options.D) {
          j++;
          break;
        }
      }
      if (options.A && options.B && options.C && options.D) {
        questions.push({
          position,
          stem,
          option_a: options.A,
          option_b: options.B,
          option_c: options.C,
          option_d: options.D,
        });
      }
      i = j;
      continue;
    }
    i++;
  }
  return { title, questions };
}

/**
 * Parses an answer-key markdown file. Expected format:
 *
 *   1. **C** — explanation text.
 *
 * Em-dash, en-dash, or plain hyphen are all tolerated as the separator.
 * Explanation may continue on continuation lines until the next numbered entry.
 */
export function parseAnswerKey(md: string): ParsedAnswer[] {
  const lines = md.split(/\r?\n/);
  const out: ParsedAnswer[] = [];
  let i = 0;
  const re = /^(\d+)\.\s+\*\*([A-D])\*\*\s*[—–-]\s*(.*)$/;
  while (i < lines.length) {
    const m = re.exec(lines[i]);
    if (m) {
      const position = parseInt(m[1], 10);
      const letter = m[2] as "A" | "B" | "C" | "D";
      let explanation = m[3].trim();
      let j = i + 1;
      while (j < lines.length) {
        const next = lines[j];
        if (re.test(next) || /^#\s+/.test(next) || /^---\s*$/.test(next)) break;
        if (/^\s*$/.test(next)) {
          j++;
          continue;
        }
        explanation += " " + next.trim();
        j++;
      }
      out.push({ position, correct_option: letter, explanation });
      i = j;
      continue;
    }
    i++;
  }
  return out;
}

export function loadQuiz(slug: string): ParsedQuiz {
  const quizMd = readFileSync(join(QUIZ_DIR, `${slug}.md`), "utf8");
  const keyMd = readFileSync(join(KEY_DIR, `${slug}-key.md`), "utf8");
  const { title, questions } = parseQuizMarkdown(quizMd);
  const answers = parseAnswerKey(keyMd);
  return { slug, title, questions, answers };
}

export function findQuizSlugs(): string[] {
  return readdirSync(QUIZ_DIR)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .map((f) => f.replace(/\.md$/, ""));
}

function questionsHash(qs: ParsedQuestion[], as: ParsedAnswer[]): string {
  const h = createHash("sha256");
  const ordered = [...qs].sort((a, b) => a.position - b.position);
  const aMap = new Map(as.map((a) => [a.position, a]));
  for (const q of ordered) {
    const ans = aMap.get(q.position);
    h.update(JSON.stringify({ ...q, ans }));
  }
  return h.digest("hex");
}

async function main() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const slugs = findQuizSlugs();
  console.log(`Found ${slugs.length} quiz markdown files.`);

  for (const slug of slugs) {
    const quiz = loadQuiz(slug);
    if (quiz.questions.length !== 20) {
      console.error(`  [skip] ${slug}: parsed ${quiz.questions.length} questions, expected 20`);
      continue;
    }
    if (quiz.answers.length !== 20) {
      console.error(`  [skip] ${slug}: parsed ${quiz.answers.length} answers, expected 20`);
      continue;
    }

    const newHash = questionsHash(quiz.questions, quiz.answers);

    // Look up existing row
    const { data: existing } = await supabase
      .from("quizzes")
      .select("id, version, title")
      .eq("slug", slug)
      .maybeSingle();

    let quizId: string;
    let version = 1;

    if (existing) {
      // Compare existing question content to decide whether to bump version
      const { data: existingQs } = await supabase
        .from("quiz_questions")
        .select("position, stem, option_a, option_b, option_c, option_d, correct_option, explanation")
        .eq("quiz_id", existing.id);

      const existingHash = createHash("sha256");
      const sorted = (existingQs ?? []).sort((a, b) => a.position - b.position);
      for (const q of sorted) {
        existingHash.update(
          JSON.stringify({
            position: q.position,
            stem: q.stem,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            ans: { position: q.position, correct_option: q.correct_option, explanation: q.explanation },
          })
        );
      }

      const same = existingHash.digest("hex") === newHash && (existingQs?.length ?? 0) === 20;
      version = same ? existing.version : existing.version + 1;

      const { error: updErr } = await supabase
        .from("quizzes")
        .update({ title: quiz.title, version })
        .eq("id", existing.id);
      if (updErr) throw updErr;
      quizId = existing.id;
    } else {
      const { data: inserted, error } = await supabase
        .from("quizzes")
        .insert({ slug, title: quiz.title })
        .select("id")
        .single();
      if (error) throw error;
      quizId = inserted!.id;
    }

    // Replace questions
    const { error: delErr } = await supabase.from("quiz_questions").delete().eq("quiz_id", quizId);
    if (delErr) throw delErr;

    const aMap = new Map(quiz.answers.map((a) => [a.position, a]));
    const rows = quiz.questions.map((q) => {
      const a = aMap.get(q.position);
      if (!a) throw new Error(`No answer for ${slug} question ${q.position}`);
      return {
        quiz_id: quizId,
        position: q.position,
        stem: q.stem,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: a.correct_option,
        explanation: a.explanation,
      };
    });

    const { error: insErr } = await supabase.from("quiz_questions").insert(rows);
    if (insErr) throw insErr;

    console.log(`  [ok] ${slug} — v${version} — ${rows.length} questions`);
  }

  console.log("Done.");
}

// Only run main when this file is executed directly, not when imported in tests.
const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
