import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export const Waitlist = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"worker" | "hirer">("worker");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({ title: "Check your email", description: "Enter a valid email address." });
      return;
    }
    toast({
      title: "You're on the list",
      description: `We'll be in touch as ${role === "worker" ? "a worker/runner" : "a hiring party"} when your area opens.`,
    });
    setEmail("");
  };

  return (
    <section id="waitlist" className="relative overflow-hidden border-t border-border bg-background py-24 sm:py-32">
      <div className="absolute inset-0 grid-bg opacity-[0.25]" />
      <div className="absolute left-1/2 top-0 h-72 w-[600px] -translate-x-1/2 bg-primary/20 blur-[120px]" />

      <div className="container-tight relative">
        <div className="mx-auto max-w-2xl text-center">
          <span className="label-stamp">Pilot launching</span>
          <h2 className="mt-3 font-display text-4xl font-semibold uppercase leading-tight text-balance sm:text-5xl">
            Be first in your area.
          </h2>
          <p className="mt-4 text-muted-foreground">
            We're opening lanes city by city. Join the waitlist and we'll route you to the right onboarding when FieldHands goes live near you.
          </p>

          <form onSubmit={onSubmit} className="mx-auto mt-10 max-w-xl">
            <div className="mb-3 inline-flex border border-border bg-surface p-1">
              {(["worker", "hirer"] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                    role === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r === "worker" ? "Work / Run" : "Hire help"}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                required
                placeholder="you@jobsite.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                maxLength={255}
                className="h-12 border-border bg-surface text-base placeholder:text-muted-foreground/60"
              />
              <Button type="submit" size="lg" className="group h-12 bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary-glow">
                Join waitlist
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              By joining you agree to FieldHands updates. No spam — just launch news for your area.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};
