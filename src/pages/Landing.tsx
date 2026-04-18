import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Hammer, Users, ClipboardCheck, Clock, Star, ArrowRight, CheckCircle2 } from "lucide-react";

const Landing = () => {
  return (
    <PublicLayout>
      {/* HERO */}
      <section className="relative overflow-hidden bg-trust text-trust-foreground">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, hsl(var(--primary)) 0%, transparent 50%)",
        }} />
        <div className="container relative py-20 md:py-32 grid gap-12 md:grid-cols-2 items-center">
          <div>
            <span className="eyebrow">Vetted field labor · Stockton, CA</span>
            <h1 className="display-xl mt-4 text-trust-foreground">
              Reliable hands.<br />
              <span className="text-primary">Real jobs.</span><br />
              Ready to work.
            </h1>
            <p className="mt-6 text-lg text-trust-foreground/75 max-w-md">
              FieldHands connects contractors, builders, and landscapers with
              vetted laborers who actually show up — and serious workers with
              jobs that pay.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="text-base h-12 px-6">
                <Link to="/for-hiring">
                  Post a job <ArrowRight className="ml-1" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-base h-12 px-6 bg-transparent border-trust-foreground/30 text-trust-foreground hover:bg-trust-foreground/10 hover:text-trust-foreground"
              >
                <Link to="/apply">Apply to work</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-trust-foreground/70">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> ID verified</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> References checked</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Two-way ratings</span>
            </div>
          </div>

          {/* Card stack */}
          <div className="relative hidden md:block">
            <div className="absolute -top-4 -right-4 w-72 rounded-lg bg-card text-card-foreground p-5 shadow-elevated rotate-3">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Open job</span>
                <span className="text-xs font-bold text-success">Verified Pro available</span>
              </div>
              <h3 className="display-md mt-2 text-lg">Sod install — 4,000 sqft</h3>
              <p className="text-sm text-muted-foreground mt-1">2 workers · Tomorrow 7:00am</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-2xl font-bold">$32<span className="text-sm font-normal text-muted-foreground">/hr</span></span>
                <Button size="sm">Apply</Button>
              </div>
            </div>
            <div className="absolute top-32 -left-2 w-64 rounded-lg bg-card text-card-foreground p-5 shadow-elevated -rotate-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold">MR</div>
                <div>
                  <div className="font-semibold text-sm">Marcus R.</div>
                  <div className="text-xs text-muted-foreground">Stockton · 4 yrs exp</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="font-bold">4.9</span>
                <span className="text-muted-foreground">· 27 jobs</span>
              </div>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary uppercase tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified Pro
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* PROOF STRIP */}
      <section className="border-y border-border bg-muted/40">
        <div className="container py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <Stat n="100%" label="ID verified" />
          <Stat n="2+" label="References required" />
          <Stat n="2-way" label="Ratings & reviews" />
          <Stat n="Local" label="Stockton-area pros" />
        </div>
      </section>

      {/* DUAL VALUE PROPS */}
      <section className="container py-20 grid gap-8 md:grid-cols-2">
        <ValueCard
          eyebrow="For contractors & builders"
          title="Stop hiring strangers off Craigslist."
          points={[
            "Every worker is ID-verified with checked references",
            "See ratings from real contractors before you hire",
            "Post a job in 2 minutes, get bids the same day",
            "No agency markup — pay the worker direct",
          ]}
          cta={{ label: "Post your first job", to: "/for-hiring" }}
        />
        <ValueCard
          dark
          eyebrow="For workers & laborers"
          title="Get paid for showing up and doing it right."
          points={[
            "Local jobs from contractors who pay on time",
            "Build a profile that travels with you",
            "Earn Verified Pro status — better jobs, higher pay",
            "Free to apply. No bidding wars on your time.",
          ]}
          cta={{ label: "Apply to work", to: "/apply" }}
        />
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-card border-y border-border">
        <div className="container py-20">
          <div className="text-center max-w-2xl mx-auto">
            <span className="eyebrow">How it works</span>
            <h2 className="display-lg mt-3">Trust, in three steps.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Step n="01" icon={ClipboardCheck} title="Apply & vet" body="Workers submit ID, work history, and at least 2 references. Our trust team reviews every applicant before they see a single job." />
            <Step n="02" icon={Hammer} title="Match & hire" body="Hirers post a labor job with scope, date, and budget. Vetted workers bid. You pick the right hand for the job." />
            <Step n="03" icon={Star} title="Rate both ways" body="After the job is done, both sides leave a review. Strong workers earn Verified Pro status and access to better jobs." />
          </div>
          <div className="mt-10 text-center">
            <Button asChild variant="outline" size="lg"><Link to="/how-it-works">See the full process</Link></Button>
          </div>
        </div>
      </section>

      {/* JOB EXAMPLES */}
      <section className="container py-20">
        <span className="eyebrow">What gets booked</span>
        <h2 className="display-lg mt-3 max-w-2xl">Real labor jobs. Not gigs.</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Sod install help", price: "$28-35/hr", time: "Same week" },
            { title: "Topsoil spreading", price: "$25-30/hr", time: "Tomorrow" },
            { title: "Site cleanup crew", price: "$22-28/hr", time: "This weekend" },
            { title: "Demo support", price: "$30-40/hr", time: "Next Monday" },
            { title: "Hauling help", price: "$25-32/hr", time: "Today" },
            { title: "Irrigation trenching", price: "$28-35/hr", time: "Thursday" },
            { title: "Site prep / grading", price: "$30-38/hr", time: "Next week" },
            { title: "General extra hands", price: "$22-28/hr", time: "Flexible" },
          ].map((j) => (
            <div key={j.title} className="rounded-lg border border-border bg-card p-5 hover:border-primary/40 hover:shadow-elevated transition-all">
              <h3 className="font-semibold">{j.title}</h3>
              <div className="mt-2 text-sm text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {j.time}
              </div>
              <div className="mt-3 text-primary font-bold">{j.price}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BAND */}
      <section className="bg-trust text-trust-foreground">
        <div className="container py-16 grid gap-8 md:grid-cols-2 items-center">
          <div>
            <h2 className="display-lg text-trust-foreground">Ready to put real hands on the job?</h2>
            <p className="mt-3 text-trust-foreground/75 max-w-md">
              No fees to post. No subscriptions. Just vetted workers when you need them.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 md:justify-end">
            <Button asChild size="lg" className="h-12 px-6"><Link to="/for-hiring">Post a job free</Link></Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 bg-transparent border-trust-foreground/30 text-trust-foreground hover:bg-trust-foreground/10 hover:text-trust-foreground">
              <Link to="/apply">I'm a worker</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="display-md text-3xl text-primary">{n}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function ValueCard({
  eyebrow, title, points, cta, dark,
}: {
  eyebrow: string; title: string; points: string[]; cta: { label: string; to: string }; dark?: boolean;
}) {
  return (
    <div className={`rounded-xl p-8 border ${dark ? "bg-trust text-trust-foreground border-trust" : "bg-card border-border"}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h3 className={`display-md mt-3 text-2xl md:text-3xl ${dark ? "text-trust-foreground" : ""}`}>{title}</h3>
      <ul className="mt-6 space-y-3">
        {points.map((p) => (
          <li key={p} className="flex gap-3 text-sm">
            <CheckCircle2 className={`h-5 w-5 flex-shrink-0 ${dark ? "text-primary" : "text-success"}`} />
            <span className={dark ? "text-trust-foreground/85" : ""}>{p}</span>
          </li>
        ))}
      </ul>
      <Button asChild className="mt-8" size="lg">
        <Link to={cta.to}>{cta.label}</Link>
      </Button>
    </div>
  );
}

function Step({ n, icon: Icon, title, body }: { n: string; icon: typeof Users; title: string; body: string }) {
  return (
    <div className="relative rounded-lg border border-border bg-background p-6">
      <div className="flex items-center justify-between">
        <span className="display-md text-4xl text-primary/30">{n}</span>
        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      <h3 className="display-md mt-4 text-xl">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

export default Landing;
