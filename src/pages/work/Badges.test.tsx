import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { BadgesView, type BadgeRow } from "./Badges";

function renderView(badges: BadgeRow[], counts: Record<string, { quizPassed: boolean; verifiedRefs: number; reviewedPhotos: number }>) {
  return render(
    <MemoryRouter>
      <BadgesView badges={badges} counts={counts} />
    </MemoryRouter>,
  );
}

describe("BadgesView", () => {
  it("renders a card for each of the 18 trades and reflects status", () => {
    const future = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const badges: BadgeRow[] = [
      {
        id: "b1",
        trade_slug: "framing-rough-carpentry",
        status: "active",
        issued_at: new Date().toISOString(),
        expires_at: future,
      },
    ];
    const counts = {
      "framing-rough-carpentry": { quizPassed: true, verifiedRefs: 3, reviewedPhotos: 9 },
      "roofing": { quizPassed: true, verifiedRefs: 1, reviewedPhotos: 0 },
      // "plumbing" left out — should be "Not started"
    };

    renderView(badges, counts);

    // 18 trade cards rendered
    expect(screen.getAllByRole("link", { name: /add evidence/i })).toHaveLength(18);

    // Active for framing
    expect(screen.getByTestId("status-framing-rough-carpentry").textContent).toMatch(/active until/i);

    // Pending for roofing (some progress, no badge)
    expect(screen.getByTestId("status-roofing").textContent).toMatch(/pending/i);

    // Not started for plumbing
    expect(screen.getByTestId("status-plumbing").textContent).toMatch(/not started/i);
  });
});
