import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Audiences = () => {
  return (
    <section className="py-24 sm:py-32">
      <div className="container-tight">
        <div className="mb-14">
          <span className="label-stamp">05 / Two sides</span>
          <h2 className="mt-3 font-display text-4xl font-semibold uppercase leading-tight sm:text-5xl">
            Built for both ends<br />of the jobsite.
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Hiring parties */}
          <div className="relative overflow-hidden border border-border bg-surface p-8 sm:p-10">
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-12 translate-x-12 rotate-12 bg-primary/10 blur-3xl" />
            <div className="relative">
              <span className="font-mono text-xs uppercase tracking-wider text-primary">For hiring parties</span>
              <h3 className="mt-4 font-display text-3xl font-semibold uppercase leading-tight">
                Stop rolling the dice on day labor.
              </h3>
              <p className="mt-4 text-muted-foreground">
                Contractors, builders, landscapers, homeowners. You can find random help anywhere. FieldHands gives you people who show up, communicate, and finish the job.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Post a job or request a runner in minutes",
                  "Pick by tier, price, reviews, and trust signals",
                  "Rate workers — protect the next hirer",
                  "Opt in or out of fair-chance matching",
                ].map((p, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-2 h-1 w-3 flex-shrink-0 bg-primary" />
                    {p}
                  </li>
                ))}
              </ul>
              <Button className="mt-8 bg-primary text-primary-foreground hover:bg-primary-glow">
                Hire vetted help <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Workers */}
          <div className="relative overflow-hidden border border-border bg-surface p-8 sm:p-10">
            <div className="absolute bottom-0 left-0 h-32 w-32 translate-y-12 -translate-x-12 -rotate-12 bg-primary/10 blur-3xl" />
            <div className="relative">
              <span className="font-mono text-xs uppercase tracking-wider text-primary">For workers & runners</span>
              <h3 className="mt-4 font-display text-3xl font-semibold uppercase leading-tight">
                Real opportunity for serious people.
              </h3>
              <p className="mt-4 text-muted-foreground">
                If you can prove yourself, the platform pays you back. Strong work climbs tiers. Top tiers see the best jobs, the best hirers, and invite-only meetups.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Low onboarding fee covers screening",
                  "Minimal worker success fee — buyers carry the platform",
                  "Two-way reviews protect you from bad jobsites",
                  "Climb to Top Hands and unlock premium access",
                ].map((p, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-2 h-1 w-3 flex-shrink-0 bg-primary" />
                    {p}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="mt-8 border-primary/50 text-foreground hover:bg-primary/10 hover:text-primary">
                Apply to work <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
