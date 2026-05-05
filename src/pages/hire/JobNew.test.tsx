import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/components/AppLayout", () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

const insertSpy = vi.fn(async () => ({ data: { id: "new-job" }, error: null }));
const tradesInsertSpy = vi.fn(async () => ({ error: null }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      if (table === "hiring_party_profiles") {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: { id: "hp-1" } }) }),
          }),
        };
      }
      if (table === "jobs") {
        return {
          insert: () => ({
            select: () => ({
              single: async () => insertSpy(),
            }),
          }),
        };
      }
      if (table === "job_trades") {
        return { insert: tradesInsertSpy };
      }
      return {};
    },
  },
}));

import JobNew from "./JobNew";

describe("JobNew — required trades picker", () => {
  it("renders the required-trades picker with all 18 trades", async () => {
    render(
      <MemoryRouter>
        <JobNew />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByTestId("required-trades-picker")).toBeInTheDocument());
    const picker = screen.getByTestId("required-trades-picker");
    // 18 canonical trades
    const checkboxes = picker.querySelectorAll('button[role="checkbox"]');
    expect(checkboxes.length).toBe(18);
  });

  it("shows the 'pick at least one trade' validation hint when empty", async () => {
    render(
      <MemoryRouter>
        <JobNew />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByTestId("required-trades-picker")).toBeInTheDocument());
    expect(screen.getByText(/Pick at least one trade/i)).toBeInTheDocument();
  });

  it("Submit is disabled until a trade is selected, and enables once one is picked", async () => {
    render(
      <MemoryRouter>
        <JobNew />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByTestId("submit-job")).toBeInTheDocument());
    const submit = screen.getByTestId("submit-job") as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    const picker = screen.getByTestId("required-trades-picker");
    const firstCheckbox = picker.querySelector('button[role="checkbox"]') as HTMLElement;
    fireEvent.click(firstCheckbox);

    await waitFor(() => expect((screen.getByTestId("submit-job") as HTMLButtonElement).disabled).toBe(false));
  });
});
