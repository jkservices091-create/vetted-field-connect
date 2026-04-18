import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({
  children,
  requireRole,
}: {
  children: ReactNode;
  requireRole?: AppRole;
}) {
  const { user, primaryRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireRole && primaryRole !== requireRole && primaryRole !== "admin") {
    // Redirect to their actual home
    if (primaryRole === "hiring_party") return <Navigate to="/hire" replace />;
    if (primaryRole === "worker") return <Navigate to="/work" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
