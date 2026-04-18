import { ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { LogOut, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

export function AppLayout({
  children,
  nav,
  role,
}: {
  children: ReactNode;
  nav: NavItem[];
  role: AppRole;
}) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const roleLabel = role === "admin" ? "Admin" : role === "hiring_party" ? "Hiring" : "Worker";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="h-16 px-5 flex items-center border-b border-sidebar-border">
          <Logo variant="light" />
        </div>
        <div className="px-3 py-4 flex-1 flex flex-col gap-1">
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/50">
            {roleLabel} dashboard
          </div>
          {nav.map((item) => (
            <SidebarLink key={item.to} item={item} active={location.pathname === item.to || location.pathname.startsWith(item.to + "/")} />
          ))}
        </div>
        <div className="border-t border-sidebar-border p-3">
          <div className="px-2 py-2 text-xs text-sidebar-foreground/60 truncate">{user?.email}</div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden h-14 border-b border-border bg-background sticky top-0 z-30 flex items-center justify-between px-4">
          <Logo />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-sidebar text-sidebar-foreground border-sidebar-border p-0">
              <div className="h-16 px-5 flex items-center border-b border-sidebar-border">
                <Logo variant="light" />
              </div>
              <div className="p-3 flex flex-col gap-1">
                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/50">
                  {roleLabel} dashboard
                </div>
                {nav.map((item) => (
                  <SidebarLink key={item.to} item={item} active={location.pathname === item.to || location.pathname.startsWith(item.to + "/")} />
                ))}
                <Button variant="ghost" size="sm" className="mt-4 w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}

// satisfy unused import
void NavLink;
