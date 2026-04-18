import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { adminNav } from "@/lib/nav";

const AdminDashboard = () => {
  return (
    <AppLayout role="admin" nav={adminNav}>
      <PageHeader
        eyebrow="Admin"
        title="Trust & operations"
        description="Review applications, manage users, and keep the network clean."
      />
      <div className="rounded-xl border-2 border-dashed border-border bg-card/40 p-12 text-center">
        <h3 className="display-md text-xl">Vetting queue and admin tools come online next.</h3>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Phase 7 builds: review queue, worker detail, hirer list, job moderation, and admin notes.
        </p>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
