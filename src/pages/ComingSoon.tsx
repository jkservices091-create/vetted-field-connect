import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { hirerNav, workerNav, adminNav } from "@/lib/nav";
import { AppRole } from "@/hooks/useAuth";

const navMap = { hiring_party: hirerNav, worker: workerNav, admin: adminNav };

export const ComingSoon = ({ role, title, description }: { role: AppRole; title: string; description: string }) => (
  <AppLayout role={role} nav={navMap[role]}>
    <PageHeader eyebrow="Coming next" title={title} description={description} />
    <div className="rounded-xl border-2 border-dashed border-border bg-card/40 p-12 text-center">
      <p className="text-muted-foreground">This screen ships in the next phase.</p>
    </div>
  </AppLayout>
);

export default ComingSoon;
