import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Three fake quizzes: one untouched, one in progress, one passed.
const FAKE_QUIZZES = [
  { id: "q-paint", slug: "painting", title: "Painting", passing_score: 16, time_limit_minutes: 30 },
  { id: "q-elec", slug: "electrical", title: "Electrical", passing_score: 16, time_limit_minutes: 30 },
  { id: "q-roof", slug: "roofing", title: "Roofing", passing_score: 16, time_limit_minutes: 30 },
];

const FAKE_ATTEMPTS = [
  // Painting: passed
  {
    id: "a1",
    quiz_id: "q-paint",
    result: "passed",
    score: 18,
    submitted_at: "2026-04-01T12:00:00Z",
    started_at: "2026-04-01T11:30:00Z",
  },
  // Electrical: in progress
  {
    id: "a2",
    quiz_id: "q-elec",
    result: "in_progress",
    score: null,
    submitted_at: null,
    started_at: "2026-05-01T08:00:00Z",
  },
  // Roofing: untouched (no attempt row)
];

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "u1" }, primaryRole: "worker", roles: ["worker"], loading: false, signOut: vi.fn() }),
}));

type Row = Record<string, unknown>;
type Resolver = (value: { data: Row[]; error: null }) => unknown;

vi.mock("@/integrations/supabase/client", () => {
  const builder = (rows: Row[]) => {
    const b = {
      select: () => b,
      eq: () => b,
      order: () => b,
      maybeSingle: () => Promise.resolve({ data: rows[0] ?? null, error: null }),
      then: (resolve: Resolver) => Promise.resolve({ data: rows, error: null }).then(resolve),
    };
    return b;
  };

  return {
    supabase: {
      from: (table: string) => {
        if (table === "quizzes") return builder(FAKE_QUIZZES);
        if (table === "worker_profiles") return builder([{ id: "wp-1" }]);
        if (table === "quiz_attempts") return builder(FAKE_ATTEMPTS);
        return builder([]);
      },
    },
  };
});

vi.mock("@/lib/quiz-db", () => {
  const builder = (rows: Row[]) => {
    const b = {
      select: () => b,
      eq: () => b,
      order: () => b,
      maybeSingle: () => Promise.resolve({ data: rows[0] ?? null, error: null }),
      then: (resolve: Resolver) => Promise.resolve({ data: rows, error: null }).then(resolve),
    };
    return b;
  };
  return {
    quizDb: {
      from: (table: string) => {
        if (table === "quizzes") return builder(FAKE_QUIZZES);
        if (table === "quiz_attempts") return builder(FAKE_ATTEMPTS);
        return builder([]);
      },
    },
  };
});

import Quizzes from "@/pages/work/Quizzes";

describe("Quizzes page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders three quizzes with correct status labels", async () => {
    render(
      <MemoryRouter>
        <Quizzes />
      </MemoryRouter>
    );

    // All three titles render
    await waitFor(() => {
      expect(screen.getByText("Painting")).toBeInTheDocument();
    });
    expect(screen.getByText("Electrical")).toBeInTheDocument();
    expect(screen.getByText("Roofing")).toBeInTheDocument();

    // Status badges
    expect(screen.getByText(/Passed on/i)).toBeInTheDocument();
    expect(screen.getByText(/In progress/i)).toBeInTheDocument();
    expect(screen.getByText(/Not started/i)).toBeInTheDocument();

    // Best score line for the passed quiz
    expect(screen.getByText(/Best score: 18 \/ 20/i)).toBeInTheDocument();
  });
});
