import { CheckCircle2, FileCheck, ShieldAlert, Users } from "lucide-react";

const gates = [
  {
    icon: FileCheck,
    title: "Identity & paperwork",
    items: ["Government ID", "Resume / work history", "Tax & contractor docs", "Insurance certificate (lane-dependent)"],
  },
  {
    icon: Users,
    title: "References",
    items: ["Strong references = fast track", "Weak references = probationary access", "No references = no full approval"],
  },
  {
    icon: CheckCircle2,
    title: "Judgment test",
    items: ["Role-based situational scenarios", "Safety, communication, ethics", "Not a school-style IQ test"],
  },
  {
    icon: ShieldAlert,
    title: "Safety screen",
    items: ["Background check (paid in onboarding)", "Permanent exclusion: harm to minors", "Fair-chance path with opt-in hirers"],
  },
];

export const Vetting = () => {
  return (
    <section id="vetting" className="relative py-24 sm:py-32">
      <div className="container-tight">
        <div className="mb-14 grid gap-10 md:grid-cols-2 md:items-end">
          <div>
            <span className="label-stamp">03 / Vetting philosophy</span>
            <h2 className="mt-3 font-display text-4xl font-semibold uppercase leading-tight sm:text-5xl">
              Four gates. No shortcuts.
            </h2>
          </div>
          <p className="text-muted-foreground">
            Screening costs money and that's part of the value. Every approved hand has cleared documentation, references, judgment, and safety review — in their lane.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2">
          {gates.map((g) => (
            <div key={g.title} className="bg-surface p-7 sm:p-9">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center border border-primary/40 bg-primary/10 text-primary">
                  <g.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-semibold uppercase">{g.title}</h3>
              </div>
              <ul className="mt-5 space-y-2.5">
                {g.items.map((it, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-steel-200">
                    <span className="mt-1.5 h-1 w-3 flex-shrink-0 bg-primary" />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Fair chance callout */}
        <div className="mt-10 grid gap-0 border border-primary/40 bg-gradient-to-br from-primary/10 via-surface to-surface md:grid-cols-[auto,1fr]">
          <div className="bg-primary p-6 md:w-48 md:p-8">
            <div className="font-mono text-xs uppercase tracking-wider text-primary-foreground/80">Policy</div>
            <div className="mt-2 font-display text-2xl font-semibold uppercase leading-tight text-primary-foreground">
              Fair<br />Chance
            </div>
          </div>
          <div className="p-6 md:p-8">
            <p className="text-pretty">
              Records aren't an automatic disqualifier. Workers with histories can be matched only with hiring parties who opt in to fair-chance hiring.
              We connect workers to legal aid, expungement, and reentry resources — because opportunity and standards aren't opposites.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
