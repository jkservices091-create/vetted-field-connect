import { describe, it, expect } from "vitest";
import { qualifiesForJob, type WorkerBadge } from "./jobQualification";

const future = "2099-01-01T00:00:00Z";
const past = "2000-01-01T00:00:00Z";

const activeBadge = (slug: string): WorkerBadge => ({
  trade_slug: slug,
  status: "active",
  expires_at: future,
});

describe("qualifiesForJob", () => {
  it("back-compat: returns qualified when there are no required trades", () => {
    const r = qualifiesForJob({ requiredTrades: [], mode: "any", workerBadges: [] });
    expect(r.qualifies).toBe(true);
    expect(r.matchedTrades).toEqual([]);
    expect(r.missingTrades).toEqual([]);
  });

  it("back-compat: required-but-not-required rows count as none", () => {
    const r = qualifiesForJob({
      requiredTrades: [{ trade_slug: "roofing", is_required: false }],
      mode: "any",
      workerBadges: [],
    });
    expect(r.qualifies).toBe(true);
  });

  describe("mode=any", () => {
    it("worker with no badges does not qualify", () => {
      const r = qualifiesForJob({
        requiredTrades: [{ trade_slug: "roofing", is_required: true }],
        mode: "any",
        workerBadges: [],
      });
      expect(r.qualifies).toBe(false);
      expect(r.missingTrades).toEqual(["roofing"]);
    });

    it("worker with one matching badge qualifies (1 required)", () => {
      const r = qualifiesForJob({
        requiredTrades: [{ trade_slug: "roofing", is_required: true }],
        mode: "any",
        workerBadges: [activeBadge("roofing")],
      });
      expect(r.qualifies).toBe(true);
      expect(r.matchedTrades).toEqual(["roofing"]);
    });

    it("worker with one matching badge out of many qualifies", () => {
      const r = qualifiesForJob({
        requiredTrades: [
          { trade_slug: "roofing", is_required: true },
          { trade_slug: "plumbing", is_required: true },
          { trade_slug: "electrical", is_required: true },
        ],
        mode: "any",
        workerBadges: [activeBadge("plumbing")],
      });
      expect(r.qualifies).toBe(true);
      expect(r.matchedTrades).toEqual(["plumbing"]);
      expect(r.missingTrades).toEqual(["roofing", "electrical"]);
    });

    it("worker with non-matching badges does not qualify", () => {
      const r = qualifiesForJob({
        requiredTrades: [{ trade_slug: "roofing", is_required: true }],
        mode: "any",
        workerBadges: [activeBadge("plumbing"), activeBadge("electrical")],
      });
      expect(r.qualifies).toBe(false);
    });
  });

  describe("mode=all", () => {
    it("worker missing one required badge does not qualify", () => {
      const r = qualifiesForJob({
        requiredTrades: [
          { trade_slug: "roofing", is_required: true },
          { trade_slug: "plumbing", is_required: true },
        ],
        mode: "all",
        workerBadges: [activeBadge("roofing")],
      });
      expect(r.qualifies).toBe(false);
      expect(r.missingTrades).toEqual(["plumbing"]);
    });

    it("worker with every required badge qualifies", () => {
      const r = qualifiesForJob({
        requiredTrades: [
          { trade_slug: "roofing", is_required: true },
          { trade_slug: "plumbing", is_required: true },
        ],
        mode: "all",
        workerBadges: [activeBadge("roofing"), activeBadge("plumbing"), activeBadge("hvac")],
      });
      expect(r.qualifies).toBe(true);
      expect(r.matchedTrades).toEqual(["roofing", "plumbing"]);
    });

    it("single required trade behaves like 'any' when matched", () => {
      const r = qualifiesForJob({
        requiredTrades: [{ trade_slug: "roofing", is_required: true }],
        mode: "all",
        workerBadges: [activeBadge("roofing")],
      });
      expect(r.qualifies).toBe(true);
    });
  });

  describe("badge state filters", () => {
    it("ignores expired badges", () => {
      const r = qualifiesForJob({
        requiredTrades: [{ trade_slug: "roofing", is_required: true }],
        mode: "any",
        workerBadges: [{ trade_slug: "roofing", status: "active", expires_at: past }],
      });
      expect(r.qualifies).toBe(false);
    });

    it("ignores revoked or pending badges", () => {
      const r = qualifiesForJob({
        requiredTrades: [{ trade_slug: "roofing", is_required: true }],
        mode: "any",
        workerBadges: [
          { trade_slug: "roofing", status: "revoked", expires_at: future },
          { trade_slug: "roofing", status: "pending_review", expires_at: future },
        ],
      });
      expect(r.qualifies).toBe(false);
    });

    it("treats null expires_at as never expiring", () => {
      const r = qualifiesForJob({
        requiredTrades: [{ trade_slug: "roofing", is_required: true }],
        mode: "any",
        workerBadges: [{ trade_slug: "roofing", status: "active", expires_at: null }],
      });
      expect(r.qualifies).toBe(true);
    });
  });
});
