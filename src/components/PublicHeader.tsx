import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function PublicHeader() {
  const { user, primaryRole } = useAuth();
  const dashboardPath =
    primaryRole === "admin" ? "/admin" : primaryRole === "hiring_party" ? "/hire" : "/work";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
            How it works
          </Link>
          <Link to="/apply" className="text-muted-foreground hover:text-foreground transition-colors">
            Find work
          </Link>
          <Link to="/for-hiring" className="text-muted-foreground hover:text-foreground transition-colors">
            Hire crews
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild size="sm">
              <Link to={dashboardPath}>Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/for-hiring">Post a job</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
