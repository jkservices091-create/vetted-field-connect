import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PublicWorkerProfileView } from "./PublicWorkerProfile";

describe("PublicWorkerProfileView", () => {
  it("renders the worker name and 4 active badges", () => {
    const issued = new Date("2026-01-10").toISOString();
    const expires = new Date("2027-01-10").toISOString();
    const worker = {
      workerProfileId: "wp-1",
      fullName: "Tony Reyes",
      city: "St. Louis, MO",
      bio: "Reliable framer.",
      verifiedJobsCount: 12,
      badges: [
        { id: "1", trade_slug: "framing-rough-carpentry", status: "active", issued_at: issued, expires_at: expires },
        { id: "2", trade_slug: "roofing", status: "active", issued_at: issued, expires_at: expires },
        { id: "3", trade_slug: "drywall-plaster", status: "active", issued_at: issued, expires_at: expires },
        { id: "4", trade_slug: "painting", status: "active", issued_at: issued, expires_at: expires },
      ],
    };

    render(
      <MemoryRouter>
        <PublicWorkerProfileView worker={worker} handle="tony-reyes" />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("public-worker-name").textContent).toBe("Tony Reyes");
    expect(screen.getByTestId("public-badge-framing-rough-carpentry")).toBeInTheDocument();
    expect(screen.getByTestId("public-badge-roofing")).toBeInTheDocument();
    expect(screen.getByTestId("public-badge-drywall-plaster")).toBeInTheDocument();
    expect(screen.getByTestId("public-badge-painting")).toBeInTheDocument();

    // Hire CTA appears
    expect(screen.getAllByRole("link", { name: /hire/i }).length).toBeGreaterThan(0);
  });
});
