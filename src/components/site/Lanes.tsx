import { ArrowUpRight, HardHat, Truck } from "lucide-react";
import laborImg from "@/assets/lane-labor.jpg";
import runnerImg from "@/assets/lane-runner.jpg";

const lanes = [
  {
    icon: HardHat,
    code: "L-01",
    name: "Labor",
    status: "Open",
    img: laborImg,
    tagline: "Extra hands, ready when you are.",
    desc: "Sod installs, topsoil spreading, hauling, demo support, site prep, irrigation help, jobsite cleanup. Bid by scope, budget, and timing.",
    points: ["Workers bid on posted jobs", "Choose by trust + price + reviews", "Both sides rated after the job"],
  },
  {
    icon: Truck,
    code: "L-02",
    name: "Runner",
    status: "Open",
    img: runnerImg,
    tagline: "Stop leaving the jobsite.",
    desc: "Vetted runners hit Home Depot, Lowe's, supply houses, rental stores, and paint stores so your crew stays on the clock and on site.",
    points: ["Vehicle + ID + insurance verified", "Receipt and proof-of-delivery", "Same-day urgency tier available"],
  },
];

const upcoming = [
  { code: "L-03", name: "Hotshot logistics", note: "Q2" },
  { code: "L-04", name: "Inspectors", note: "Q3" },
  { code: "L-05", name: "Property vendors", note: "Later" },
];

export const Lanes = () => {
  return (
    <section id="lanes" className="relative py-24 sm:py-32">
      <div className="container-tight">
        <div className="mb-14 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="label-stamp">02 / Service lanes</span>
            <h2 className="mt-3 font-display text-4xl font-semibold uppercase leading-tight sm:text-5xl">
              Pick your lane.<br />Prove you belong in it.
            </h2>
          </div>
          <p className="max-w-md text-muted-foreground">
            FieldHands isn't a free-for-all gig board. Every worker chooses a service path and clears lane-specific vetting before they see a single job.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {lanes.map((lane) => (
            <article
              key={lane.code}
              className="group relative overflow-hidden border border-border bg-surface transition-all duration-300 hover:border-primary/60 hover:shadow-amber"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={lane.img}
                  alt={`${lane.name} lane on FieldHands`}
                  loading="lazy"
                  width={1024}
                  height={640}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" />
                <div className="absolute left-4 top-4 flex items-center gap-2">
                  <span className="bg-primary px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                    {lane.code}
                  </span>
                  <span className="border border-primary/60 bg-background/60 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-primary backdrop-blur">
                    {lane.status}
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <lane.icon className="h-6 w-6 text-primary" />
                      <h3 className="font-display text-2xl font-semibold uppercase">{lane.name}</h3>
                    </div>
                    <p className="mt-1.5 text-sm text-primary">{lane.tagline}</p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>

                <p className="mt-5 text-muted-foreground">{lane.desc}</p>

                <ul className="mt-6 space-y-2 border-t border-border pt-5">
                  {lane.points.map((p, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="mt-2 h-1 w-3 flex-shrink-0 bg-primary" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 border border-dashed border-border bg-surface/40 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="label-stamp">Roadmap</span>
              <p className="mt-1.5 font-display text-lg uppercase">Lanes opening next</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {upcoming.map((u) => (
                <span key={u.code} className="flex items-center gap-2 border border-border bg-background px-3 py-1.5 text-sm">
                  <span className="font-mono text-xs text-primary">{u.code}</span>
                  <span>{u.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">· {u.note}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
