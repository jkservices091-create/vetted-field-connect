export const vettingStatus = {
  applicant: "Applicant",
  pending_review: "Pending Review",
  verified: "Verified",
  verified_pro: "Verified Pro",
  rejected: "Rejected",
} as const;

export const jobStatus = {
  draft: "Draft",
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
  canceled: "Canceled",
} as const;

export const applicationStatus = {
  submitted: "Submitted",
  accepted: "Accepted",
  declined: "Declined",
  withdrawn: "Withdrawn",
} as const;

export const jobCategories = [
  "Sod & turf",
  "Topsoil & grading",
  "Site cleanup",
  "Hauling",
  "Demo support",
  "Irrigation help",
  "Site prep",
  "General labor",
] as const;

export const skillOptions = [
  "Sod laying",
  "Topsoil spreading",
  "Wheelbarrow",
  "Shovel work",
  "Rake & finish",
  "Site cleanup",
  "Hauling",
  "Light demo",
  "Irrigation install",
  "Compactor",
  "Skid steer",
  "Hand tools",
] as const;

// Canonical trade slugs (from public.trades; mirrored here for static labels & suggestion mapping).
export const tradeSlugs = [
  "site-prep-excavation",
  "concrete-foundations",
  "framing-rough-carpentry",
  "roofing",
  "siding-exterior-finish",
  "windows-doors",
  "insulation-air-sealing",
  "drywall-plaster",
  "painting",
  "finish-carpentry-trim",
  "flooring",
  "tile-stone",
  "plumbing",
  "electrical",
  "hvac",
  "cabinetry-countertops",
  "landscaping-hardscaping",
  "handyman-punch-list",
] as const;

export type TradeSlug = (typeof tradeSlugs)[number];

export const tradeTitles: Record<TradeSlug, string> = {
  "site-prep-excavation": "Site Prep & Excavation",
  "concrete-foundations": "Concrete & Foundations",
  "framing-rough-carpentry": "Framing & Rough Carpentry",
  roofing: "Roofing",
  "siding-exterior-finish": "Siding & Exterior Finish",
  "windows-doors": "Windows & Doors",
  "insulation-air-sealing": "Insulation & Air Sealing",
  "drywall-plaster": "Drywall & Plaster",
  painting: "Painting",
  "finish-carpentry-trim": "Finish Carpentry & Trim",
  flooring: "Flooring",
  "tile-stone": "Tile & Stone",
  plumbing: "Plumbing",
  electrical: "Electrical",
  hvac: "HVAC",
  "cabinetry-countertops": "Cabinetry & Countertops",
  "landscaping-hardscaping": "Landscaping & Hardscaping",
  "handyman-punch-list": "Handyman & Punch List",
};

// Maps the legacy `jobCategories` value → suggested trade slugs to pre-fill
// when a hirer posts a new job. Hirer can confirm or change the selection.
export const categoryToTradesSuggestion: Record<string, TradeSlug[]> = {
  "Sod & turf": ["landscaping-hardscaping"],
  "Topsoil & grading": ["landscaping-hardscaping", "site-prep-excavation"],
  "Site cleanup": ["handyman-punch-list", "site-prep-excavation"],
  Hauling: ["site-prep-excavation", "handyman-punch-list"],
  "Demo support": ["site-prep-excavation", "handyman-punch-list"],
  "Irrigation help": ["landscaping-hardscaping", "plumbing"],
  "Site prep": ["site-prep-excavation"],
  "General labor": ["handyman-punch-list"],
};

export const companyTypes = [
  "General contractor",
  "Landscaper",
  "Builder",
  "Property manager",
  "Homeowner",
  "Other",
] as const;
