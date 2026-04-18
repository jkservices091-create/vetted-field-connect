import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShieldCheck, FileCheck2, Users, Briefcase, MessageSquare, Star, AlertOctagon } from "lucide-react";

const HowItWorks = () => {
  return (
    <PublicLayout>
      <section className="bg-trust text-trust-foreground">
        <div className="container py-16 md:py-20">
          <span className="eyebrow">How it works</span>
          <h1 className="display-xl mt-4 text-trust-foreground max-w-3xl">
            We curate the network. <span className="text-primary">You get the job done.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-trust-foreground/75 text-lg">
            FieldHands isn't an open marketplace. Workers earn their place through a real
            vetting process — so when you hire, you hire someone who's already been checked.
          </p>
        </div>
      </section>

      {/* WORKER PATH */}
      <section className="container py-16">
        <span className="eyebrow">For workers</span>
        <h2 className="display-lg mt-3">The vetting path</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Stage n="1" icon={Users} title="Apply & build your profile">
            Tell us your name, city, skills, and work history. Add a profile photo and a short bio explaining what you do best.
          </Stage>
          <Stage n="2" icon={FileCheck2} title="Verification intake">
            Upload a government ID. List <strong>at least 2 references</strong> with phone numbers — past contractors, foremen, or supervisors. Consent to a background check and accept terms.
          </Stage>
          <Stage n="3" icon={ShieldCheck} title="Trust review">
            Our team reviews your application, calls references, and confirms your work history. This is where it counts — strong references = faster approval.
          </Stage>
          <Stage n="4" icon={Briefcase} title="Get hired">
            Once approved, browse open jobs in your area, submit a bid with your hourly rate or flat price, and message the hirer directly.
          </Stage>
        </div>
      </section>

      {/* HIRER PATH */}
      <section className="bg-muted/40 border-y border-border">
        <div className="container py-16">
          <span className="eyebrow">For hirers</span>
          <h2 className="display-lg mt-3">From posted to hired in a day</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Stage n="1" icon={Users} title="Set up your company">
              Create a hiring party profile — company name, type of work, service area, and contact info.
            </Stage>
            <Stage n="2" icon={Briefcase} title="Post a labor job">
              Title, scope, date, time, address, photos, hourly or flat budget, and how many workers you need.
            </Stage>
            <Stage n="3" icon={MessageSquare} title="Review bids & message">
              Vetted workers apply with their rate and a short pitch. You see their profile, vetting status, and ratings. Message them in-app.
            </Stage>
            <Stage n="4" icon={Star} title="Hire, complete, review">
              Pick one worker, confirm the job, and after it's done — leave a two-way review. Both reputations grow.
            </Stage>
          </div>
        </div>
      </section>

      {/* TRUST TIERS */}
      <section className="container py-16">
        <span className="eyebrow">Trust tiers</span>
        <h2 className="display-lg mt-3">How workers earn status</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Tier label="Verified" sub="Reviewed & approved" desc="ID checked. References called. Background consent on file." />
          <Tier label="Verified Pro" highlight sub="Track record on platform" desc="3+ completed jobs with strong ratings. Better visibility, premium jobs." />
          <Tier label="Top Hands" sub="Coming soon" desc="Elite invite-only tier for the most trusted workers in the network." />
        </div>
      </section>

      {/* PRICING SUMMARY */}
      <section className="bg-muted/40 border-y border-border">
        <div className="container py-16">
          <span className="eyebrow">Pricing</span>
          <h2 className="display-lg mt-3">Subscription pricing. Ratings unlock better rates.</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl">Predictable monthly cost on both sides. The better your reviews, the more you save (hirers) or take home (workers).</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 max-w-4xl">
            <div className="rounded-lg border border-success/30 bg-success/5 p-6">
              <span className="text-xs uppercase tracking-wider font-bold text-success">For workers</span>
              <p className="display-md text-3xl mt-2">$15<span className="text-base text-muted-foreground">/mo</span></p>
              <p className="text-sm text-muted-foreground mt-2">Flat subscription. Plus a sliding 2–10% cut from each payout based on your rating — top-rated pros keep 98% of their wage. 30-day free trial.</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <span className="text-xs uppercase tracking-wider font-bold text-primary">For hirers</span>
              <p className="display-md text-3xl mt-2">From $29<span className="text-base text-muted-foreground">/mo</span></p>
              <p className="text-sm text-muted-foreground mt-2">Four tiers from 1 to unlimited active jobs. Earn up to 20% off your plan with strong worker reviews. 30-day free trial.</p>
            </div>
          </div>
          <div className="mt-6">
            <Button asChild variant="outline"><Link to="/pricing">See full pricing breakdown</Link></Button>
          </div>
        </div>
      </section>

      {/* SAFETY EXCLUSION */}
      <section className="container pb-16">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 flex gap-4">
          <AlertOctagon className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold">Safety-first exclusions</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              FieldHands does not work with anyone who has been convicted of offenses involving harm
              to children. This is a permanent disqualification, not a blanket no-record rule. We're
              committed to opportunity — but never at the cost of safety.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-trust text-trust-foreground">
        <div className="container py-16 text-center">
          <h2 className="display-lg text-trust-foreground">Ready to get started?</h2>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg"><Link to="/apply">Apply as a worker</Link></Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-trust-foreground/30 text-trust-foreground hover:bg-trust-foreground/10 hover:text-trust-foreground">
              <Link to="/for-hiring">Post a job</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

function Stage({ n, icon: Icon, title, children }: { n: string; icon: typeof Users; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-4">
        <div className="display-md text-4xl text-primary">{n}</div>
        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      <h3 className="display-md mt-3 text-lg">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}

function Tier({ label, sub, desc, highlight }: { label: string; sub: string; desc: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-6 border ${highlight ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5" />
        <span className="display-md text-xl">{label}</span>
      </div>
      <div className={`text-xs uppercase tracking-wider mt-1 ${highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{sub}</div>
      <p className={`mt-3 text-sm ${highlight ? "text-primary-foreground/90" : "text-muted-foreground"} leading-relaxed`}>{desc}</p>
    </div>
  );
}

export default HowItWorks;
