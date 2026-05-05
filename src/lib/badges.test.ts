import { describe, it, expect } from "vitest";
import { computeBadgeEligibility, isValidHandle } from "./badges";

describe("computeBadgeEligibility", () => {
  it("is eligible when all three conditions are met", () => {
    const r = computeBadgeEligibility(true, 3, 9);
    expect(r.eligible).toBe(true);
    expect(r.refsRemaining).toBe(0);
    expect(r.photosRemaining).toBe(0);
  });

  it("is eligible when quotas are exceeded", () => {
    expect(computeBadgeEligibility(true, 5, 12).eligible).toBe(true);
  });

  it("is not eligible when quiz not passed", () => {
    const r = computeBadgeEligibility(false, 3, 9);
    expect(r.eligible).toBe(false);
    expect(r.quizPassed).toBe(false);
    expect(r.refsMet).toBe(true);
    expect(r.photosMet).toBe(true);
  });

  it("is not eligible with too few refs", () => {
    const r = computeBadgeEligibility(true, 2, 9);
    expect(r.eligible).toBe(false);
    expect(r.refsMet).toBe(false);
    expect(r.refsRemaining).toBe(1);
  });

  it("is not eligible with too few photos", () => {
    const r = computeBadgeEligibility(true, 3, 5);
    expect(r.eligible).toBe(false);
    expect(r.photosMet).toBe(false);
    expect(r.photosRemaining).toBe(4);
  });

  it("is not eligible when nothing is met", () => {
    const r = computeBadgeEligibility(false, 0, 0);
    expect(r.eligible).toBe(false);
    expect(r.refsRemaining).toBe(3);
    expect(r.photosRemaining).toBe(9);
  });

  it("clamps remaining counts to zero", () => {
    const r = computeBadgeEligibility(true, 10, 100);
    expect(r.refsRemaining).toBe(0);
    expect(r.photosRemaining).toBe(0);
  });
});

describe("isValidHandle", () => {
  it("accepts good handles", () => {
    expect(isValidHandle("tony")).toBe(true);
    expect(isValidHandle("tony-reyes")).toBe(true);
    expect(isValidHandle("framer42")).toBe(true);
  });

  it("rejects too short", () => {
    expect(isValidHandle("ab")).toBe(false);
  });

  it("rejects too long", () => {
    expect(isValidHandle("a".repeat(33))).toBe(false);
  });

  it("rejects uppercase, spaces, special chars", () => {
    expect(isValidHandle("Tony")).toBe(false);
    expect(isValidHandle("tony reyes")).toBe(false);
    expect(isValidHandle("tony.reyes")).toBe(false);
  });

  it("rejects leading or trailing hyphen", () => {
    expect(isValidHandle("-tony")).toBe(false);
    expect(isValidHandle("tony-")).toBe(false);
  });
});
