import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#lanes", label: "Lanes" },
  { href: "#vetting", label: "Vetting" },
  { href: "#tiers", label: "Tiers" },
  { href: "#faq", label: "FAQ" },
];

export const Header = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container-tight flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center bg-primary text-primary-foreground shadow-amber">
            <span className="font-mono text-sm font-bold">F</span>
          </span>
          <span>FIELD<span className="text-primary">HANDS</span></span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm">Sign in</Button>
          <Button variant="default" size="sm" className="bg-primary text-primary-foreground hover:bg-primary-glow">
            Join the waitlist
          </Button>
        </div>

        <button
          className="grid h-9 w-9 place-items-center rounded-sm border border-border md:hidden"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="container-tight flex flex-col gap-1 py-4">
            {links.map(l => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-l-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <Button variant="outline" size="sm">Sign in</Button>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary-glow">Join the waitlist</Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
