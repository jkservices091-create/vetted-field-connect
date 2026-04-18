import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-trust text-trust-foreground mt-24">
      <div className="container py-12 grid gap-8 md:grid-cols-4">
        <div className="space-y-3">
          <Logo variant="light" />
          <p className="text-sm text-trust-foreground/70 max-w-xs">
            Vetted field labor for serious contractors. Built for the jobsite.
          </p>
        </div>
        <FooterCol title="For hirers">
          <FooterLink to="/for-hiring">Post a job</FooterLink>
          <FooterLink to="/pricing">Pricing</FooterLink>
          <FooterLink to="/how-it-works">How it works</FooterLink>
          <FooterLink to="/login">Log in</FooterLink>
        </FooterCol>
        <FooterCol title="For workers">
          <FooterLink to="/apply">Apply to work — free</FooterLink>
          <FooterLink to="/how-it-works">Vetting process</FooterLink>
          <FooterLink to="/login">Log in</FooterLink>
        </FooterCol>
        <FooterCol title="Company">
          <span className="text-sm text-trust-foreground/60">St. Louis, MO · MVP</span>
          <span className="text-sm text-trust-foreground/60">© {new Date().getFullYear()} FieldHands</span>
        </FooterCol>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{title}</h4>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-sm text-trust-foreground/80 hover:text-trust-foreground transition-colors">
      {children}
    </Link>
  );
}
