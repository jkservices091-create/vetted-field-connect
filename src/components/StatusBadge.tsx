import { cn } from "@/lib/utils";
import { jobStatus, applicationStatus } from "@/lib/labels";

const jobCls: Record<keyof typeof jobStatus, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  open: "bg-success/15 text-success border-success/30",
  in_progress: "bg-primary/15 text-primary border-primary/40",
  completed: "bg-secondary/15 text-secondary border-secondary/30",
  canceled: "bg-destructive/10 text-destructive border-destructive/30",
};

const appCls: Record<keyof typeof applicationStatus, string> = {
  submitted: "bg-warning/15 text-warning-foreground border-warning/30",
  accepted: "bg-success/15 text-success border-success/30",
  declined: "bg-destructive/10 text-destructive border-destructive/30",
  withdrawn: "bg-muted text-muted-foreground border-border",
};

export function JobStatusBadge({ status, className }: { status: keyof typeof jobStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", jobCls[status], className)}>
      {jobStatus[status]}
    </span>
  );
}

export function ApplicationStatusBadge({ status, className }: { status: keyof typeof applicationStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", appCls[status], className)}>
      {applicationStatus[status]}
    </span>
  );
}
