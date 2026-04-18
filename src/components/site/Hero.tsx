import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-jobsite.jpg";

export const Hero = () => {
  return (
    <section id="top" className="relative isolate overflow-hidden pt-16">
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImg}
          alt="Construction crew coordinating at a jobsite during golden hour"
          width={1920}
          height={1080}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      <div className="container-tight relative pb-24 pt-20 sm:pb-32 sm:pt-28 lg:pb-40 lg:pt-36">
        <div className="max-w-3xl animate-fade-up">
          <div className="mb-6 inline-flex items-center gap-2 border border-border/80 bg-background/40 px-3 py-1.5 backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse bg-primary" />
            <span className="label-stamp">Now vetting · Texas pilot</span>
          </div>

          <h1 className="font-display text-5xl font-semibold uppercase leading-[0.95] tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Vetted hands.<br />
            <span className="text-primary">Real jobsites.</span><br />
            Boots on the ground.
          </h1>

          <p className="mt-6 max-w-xl text-base text-steel-200 text-pretty sm:text-lg">
            FieldHands is the one-stop marketplace for trusted field labor and runner services.
            Every worker is screened, referenced, and tier-rated — so when you book, they show up.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="group h-12 bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary-glow">
              Hire vetted help
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 border-steel-200/40 bg-background/30 px-6 font-semibold backdrop-blur hover:bg-background/50">
              Apply to work
            </Button>
          </div>

          <div className="mt-10 flex items-center gap-3 text-sm text-steel-200">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span>ID + background check + references required for every approved hand.</span>
          </div>
        </div>
      </div>

      {/* stats strip */}
      <div className="relative border-y border-border bg-background/70 backdrop-blur">
        <div className="container-tight grid grid-cols-2 divide-x divide-border md:grid-cols-4">
          {[
            { k: "4-step", v: "Vetting gate" },
            { k: "2-way", v: "Reviews" },
            { k: "5 tiers", v: "Worker access" },
            { k: "0 cuts", v: "Worker success fee*" },
          ].map((s, i) => (
            <div key={i} className="px-4 py-5 sm:px-6 sm:py-6">
              <div className="font-display text-2xl font-semibold text-primary sm:text-3xl">{s.k}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
