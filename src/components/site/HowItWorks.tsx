const steps = [
  { n: "01", t: "Choose a lane", d: "Sign up as a worker or hiring party. Workers pick the service path they want to operate in." },
  { n: "02", t: "Clear the gate", d: "ID, references, background check, insurance where required, and a role-based judgment test." },
  { n: "03", t: "Get matched", d: "Hiring parties post. Workers bid or get booked. Tier and rating drive who sees what." },
  { n: "04", t: "Earn your status", d: "Both sides review. Show up, finish strong, climb tiers — Verified → Pro → Top Hands." },
];

export const HowItWorks = () => {
  return (
    <section id="how" className="relative border-y border-border bg-gradient-steel py-24 sm:py-32">
      <div className="container-tight">
        <div className="mb-14 max-w-2xl">
          <span className="label-stamp">01 / How it works</span>
          <h2 className="mt-3 font-display text-4xl font-semibold uppercase leading-tight sm:text-5xl">
            Curated, not crowded.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Nobody gets full access just by making a profile. FieldHands earns its quality the same way good crews do — slow at the start, sharper over time.
          </p>
        </div>

        <ol className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li key={s.n} className="group relative bg-surface p-7 transition-colors hover:bg-surface-elevated">
              <div className="font-mono text-sm text-primary">{s.n}</div>
              <h3 className="mt-6 font-display text-xl font-semibold uppercase">{s.t}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{s.d}</p>
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary transition-all duration-500 group-hover:w-full" />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
