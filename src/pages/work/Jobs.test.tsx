import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/components/AppLayout", () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

vi.mock("@/integrations/supabase/client", () => {
  const futureIso = "2099-01-01T00:00:00Z";
  const visibleJobs = [
    {
      id: "job-1",
      title: "Roof tear-off crew needed",
      description: "Three days of work",
      category: "Site prep",
      city: "St. Louis",
      date_needed: "2099-06-01",
      start_time: "07:00",
      estimated_duration_hours: 8,
      budget_type: "hourly",
      budget_amount: 30,
      workers_needed: 3,
      hiring_party_id: "hp-1",
      qualification_mode: "any",
      status: "open",
      created_at: "2099-01-01",
    },
    {
      id: "job-2",
      title: "Plumbing assist",
      description: "Helper needed",
      category: "General labor",
      city: "St. Louis",
      date_needed: "2099-07-01",
      start_time: "08:00",
      estimated_duration_hours: 4,
      budget_type: "hourly",
      budget_amount: 25,
      workers_needed: 1,
      hiring_party_id: "hp-1",
      qualification_mode: "any",
      status: "open",
      created_at: "2099-01-01",
    },
  ];
  // Worker is qualified for job-1 (roofing) but NOT job-2 (plumbing).
  // To exercise the locked-card path with a single render, we have BOTH
  // jobs surface even from the visible-jobs query — the UI itself decides
  // qualified/locked from the badge set + job_trades, and the real
  // worker_visible_jobs view filters server-side. Here the client-side
  // qualifiesForJob() helper handles the indicator logic.
  const jobTrades = [
    { job_id: "job-1", trade_slug: "roofing", is_required: true },
    { job_id: "job-2", trade_slug: "plumbing", is_required: true },
  ];
  const hps = [{ id: "hp-1", company_name: "Acme Roofing" }];
  const badges = [{ trade_slug: "roofing", status: "active", expires_at: futureIso }];
  const workerProfile = { id: "wp-1", vetting_status: "verified" };

  const supabase = {
    from(table: string) {
      if (table === "worker_profiles") {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: workerProfile }) }),
          }),
        };
      }
      if (table === "trade_badges") {
        return {
          select: () => ({
            eq: () => ({ eq: async () => ({ data: badges }) }),
          }),
        };
      }
      if (table === "worker_visible_jobs" || table === "jobs") {
        return {
          select: () => ({
            eq: () => ({ order: async () => ({ data: visibleJobs }) }),
          }),
        };
      }
      if (table === "job_trades") {
        return {
          select: () => ({ in: async () => ({ data: jobTrades }) }),
        };
      }
      if (table === "hiring_party_profiles") {
        return {
          select: () => ({ in: async () => ({ data: hps }) }),
        };
      }
      return { select: () => ({ eq: async () => ({ data: [] }) }) };
    },
  };
  return { supabase };
});

import WorkerJobs from "./Jobs";

describe("Worker Jobs page", () => {
  it("renders qualified jobs and locked cards based on the worker's badges", async () => {
    render(
      <MemoryRouter>
        <WorkerJobs />
      </MemoryRouter>,
    );

    // Both jobs render once load completes.
    await waitFor(() => expect(screen.getByText("Roof tear-off crew needed")).toBeInTheDocument(), {
      timeout: 4000,
    });
    expect(screen.getByText("Plumbing assist")).toBeInTheDocument();

    // The roofing job shows ✓ qualifies; the plumbing job is rendered as a locked card.
    expect(screen.getByText(/You qualify/i)).toBeInTheDocument();
    expect(screen.getByTestId("qualified-job")).toBeInTheDocument();
    expect(screen.getByTestId("locked-job")).toBeInTheDocument();
    expect(screen.getByText(/Pass quiz to unlock/i)).toBeInTheDocument();
  });

  it("renders the worker's badges as filter chips", async () => {
    render(
      <MemoryRouter>
        <WorkerJobs />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText(/Your badges/i)).toBeInTheDocument(), {
      timeout: 4000,
    });
    expect(screen.getAllByText("Roofing").length).toBeGreaterThan(0);
  });

  it("renders the 'show jobs I'm not qualified for' toggle", async () => {
    render(
      <MemoryRouter>
        <WorkerJobs />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByTestId("show-all-toggle")).toBeInTheDocument(), {
      timeout: 4000,
    });
  });
});
