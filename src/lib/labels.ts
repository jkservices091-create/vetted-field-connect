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

export const companyTypes = [
  "General contractor",
  "Landscaper",
  "Builder",
  "Property manager",
  "Homeowner",
  "Other",
] as const;
