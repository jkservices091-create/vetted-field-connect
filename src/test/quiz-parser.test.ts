import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseQuizMarkdown, parseAnswerKey } from "../../scripts/seed-quizzes";

const ROOT = join(__dirname, "..", "..");

describe("parseQuizMarkdown", () => {
  it("extracts title and 20 questions from painting.md", () => {
    const md = readFileSync(join(ROOT, "quizzes", "painting.md"), "utf8");
    const { title, questions } = parseQuizMarkdown(md);
    expect(title).toBe("Painting");
    expect(questions).toHaveLength(20);
    // Positions are sequential 1..20
    expect(questions.map((q) => q.position)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 1)
    );
    // Each question has all four options
    for (const q of questions) {
      expect(q.option_a.length).toBeGreaterThan(0);
      expect(q.option_b.length).toBeGreaterThan(0);
      expect(q.option_c.length).toBeGreaterThan(0);
      expect(q.option_d.length).toBeGreaterThan(0);
      expect(q.stem.length).toBeGreaterThan(5);
    }
    // Q1 text spot-check (RRP rule trigger)
    expect(questions[0].stem).toMatch(/RRP/i);
  });
});

describe("parseAnswerKey", () => {
  it("extracts 20 answers from painting-key.md", () => {
    const md = readFileSync(join(ROOT, "quizzes", "answer-keys", "painting-key.md"), "utf8");
    const answers = parseAnswerKey(md);
    expect(answers).toHaveLength(20);
    expect(answers.map((a) => a.position)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 1)
    );
    // Q1 is C per the painting key
    expect(answers[0].correct_option).toBe("C");
    expect(answers[0].explanation).toMatch(/RRP/i);
    // Q5 is D
    expect(answers.find((a) => a.position === 5)?.correct_option).toBe("D");
    // Every answer is one of A-D
    for (const a of answers) {
      expect(["A", "B", "C", "D"]).toContain(a.correct_option);
      expect(a.explanation.length).toBeGreaterThan(0);
    }
  });
});
