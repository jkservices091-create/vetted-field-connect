export const TRADES: { slug: string; title: string }[] = [
  { slug: "site-prep-excavation", title: "Site Prep & Excavation" },
  { slug: "concrete-foundations", title: "Concrete & Foundations" },
  { slug: "framing-rough-carpentry", title: "Framing & Rough Carpentry" },
  { slug: "roofing", title: "Roofing" },
  { slug: "siding-exterior-finish", title: "Siding & Exterior Finish" },
  { slug: "windows-doors", title: "Windows & Doors" },
  { slug: "insulation-air-sealing", title: "Insulation & Air Sealing" },
  { slug: "drywall-plaster", title: "Drywall & Plaster" },
  { slug: "painting", title: "Painting" },
  { slug: "finish-carpentry-trim", title: "Finish Carpentry & Trim" },
  { slug: "flooring", title: "Flooring" },
  { slug: "tile-stone", title: "Tile & Stone" },
  { slug: "plumbing", title: "Plumbing" },
  { slug: "electrical", title: "Electrical" },
  { slug: "hvac", title: "HVAC" },
  { slug: "cabinetry-countertops", title: "Cabinetry & Countertops" },
  { slug: "landscaping-hardscaping", title: "Landscaping & Hardscaping" },
  { slug: "handyman-punch-list", title: "Handyman & Punch List" },
];

export const REQUIRED_VERIFIED_REFS = 3;
export const REQUIRED_REVIEWED_PHOTOS = 9;

export type BadgeEligibility = {
  eligible: boolean;
  quizPassed: boolean;
  refsMet: boolean;
  photosMet: boolean;
  refsRemaining: number;
  photosRemaining: number;
};

/**
 * Mirrors the logic of the SQL `evaluate_trade_badge` function so the worker UI
 * can show progress without round-tripping through the DB.
 */
export function computeBadgeEligibility(
  quizPassed: boolean,
  verifiedRefsCount: number,
  reviewedPhotosCount: number,
): BadgeEligibility {
  const refsMet = verifiedRefsCount >= REQUIRED_VERIFIED_REFS;
  const photosMet = reviewedPhotosCount >= REQUIRED_REVIEWED_PHOTOS;
  return {
    eligible: quizPassed && refsMet && photosMet,
    quizPassed,
    refsMet,
    photosMet,
    refsRemaining: Math.max(0, REQUIRED_VERIFIED_REFS - verifiedRefsCount),
    photosRemaining: Math.max(0, REQUIRED_REVIEWED_PHOTOS - reviewedPhotosCount),
  };
}

export const HANDLE_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/;

export function isValidHandle(handle: string): boolean {
  if (handle.length < 3 || handle.length > 32) return false;
  return HANDLE_REGEX.test(handle);
}
