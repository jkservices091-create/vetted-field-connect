import { vettingStatus } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { ShieldCheck, Shield, Clock, XCircle, UserCheck } from "lucide-react";

type Status = "applicant" | "pending_review" | "verified" | "verified_pro" | "rejected";

const config: Record<Status, { icon: typeof Shield; cls: string; label: string }> = {
  applicant: { icon: UserCheck, cls: "bg-muted text-muted-foreground border-border", label: "Applicant" },
  pending_review: { icon: Clock, cls: "bg-warning/15 text-warning-foreground border-warning/30", label: "Pending review" },
  verified: { icon: ShieldCheck, cls: "bg-success/15 text-success border-success/30", label: "Verified" },
  verified_pro: { icon: ShieldCheck, cls: "bg-primary/15 text-primary border-primary/40", label: "Verified Pro" },
  rejected: { icon: XCircle, cls: "bg-destructive/10 text-destructive border-destructive/30", label: "Rejected" },
};

export function TrustBadge({ status, className }: { status: Status; className?: string }) {
  const c = config[status];
  const Icon = c.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        c.cls,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {c.label}
    </span>
  );
}
