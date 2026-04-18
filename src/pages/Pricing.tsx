import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, Hammer, Star, TrendingDown } from "lucide-react";

const Pricing = () => {
  return (
    <PublicLayout>
      {/* HERO */}
      <section className="bg-trust text-trust-foreground">
        <div className="container py-16 md:py-20">
          <span className="eyebrow">Pricing</span>
          <h1 className="display-xl mt-4 text-trust-foreground max-w-3xl">
            Your rating <span className="text-primary">sets your rate.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-trust-foreground/75 text-lg">
            Free to join, free to post, free to bid. FieldHands only makes money on completed jobs — and the better you're rated, the less you pay. Good work pays better. On both sides.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-trust-foreground/70">
            <span className="flex items-center gap-1.5"><TrendingDown className="h-4 w-4 text-primary" /> Fees drop as ratings rise</span>
            <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-primary" /> Two-way reviews drive everything</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> No subscriptions, ever</span>
          </div>
        </div>
      </section>

      {/* TIERS */}
      <section className="container py-16">
        <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
          {/* WORKER TIER */}
          <div className="rounded-2xl border-2 border-success/40 bg-success/5 p-8 relative">
            <div className="absolute -top-3 left-6 bg-success text-success-foreground text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              For workers
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Hammer className="h-5 w-5 text-success" />
              <span className="text-sm font-semibold">Workers & laborers</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="display-xl text-success">2–10%</span>
              <span className="text-muted-foreground">cut on completed jobs</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Free to sign up, get verified, and bid. You only pay after a job pays out.</p>

            <SlidingTable
              title="Worker fee by rating"
              accent="success"
              rows={[
                { tier: "5★ — Top Hand", fee: "2%", note: "Keep 98% of your wage" },
                { tier: "4★ — Verified Pro", fee: "4%", note: "Keep 96%" },
                { tier: "New worker (no rating yet)", fee: "5%", note: "Default starting rate" },
                { tier: "3★", fee: "6%", note: "Keep 94%" },
                { tier: "2★", fee: "8%", note: "Keep 92%" },
                { tier: "1★", fee: "10%", note: "Keep 90%" },
              ]}
            />

            <ul className="mt-6 space-y-3 text-sm">
              <Item>Free signup, profile, and verification</Item>
              <Item>Free to browse and bid on every job — no limits</Item>
              <Item>Your current rate is shown clearly before you bid</Item>
              <Item>No subscriptions, no application fees, no per-bid fees</Item>
            </ul>
            <Button asChild size="lg" className="mt-8 w-full bg-success hover:bg-success/90 text-success-foreground">
              <Link to="/apply">Apply as a worker</Link>
            </Button>
          </div>

          {/* HIRER TIER */}
          <div className="rounded-2xl border-2 border-border bg-card p-8 relative">
            <div className="absolute -top-3 left-6 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              For hirers
            </div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">Contractors, builders, landscapers</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="display-xl text-primary">10–15%</span>
              <span className="text-muted-foreground">service fee on bookings</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Free to post and review bids. Charged on top of the job total only when you book a worker.</p>

            <SlidingTable
              title="Hirer fee by your rating"
              accent="primary"
              rows={[
                { tier: "5★ — Trusted Hirer", fee: "10%", note: "Best rate" },
                { tier: "4★", fee: "12%", note: "" },
                { tier: "New hirer (no rating yet)", fee: "15%", note: "Default starting rate" },
                { tier: "3★ and below", fee: "15%", note: "Max fee" },
              ]}
            />

            <ul className="mt-6 space-y-3 text-sm">
              <Item>Free company profile and unlimited job posts</Item>
              <Item>Free to review bids and message workers</Item>
              <Item>Pay only when you book — never for posting</Item>
              <Item>Your fee drops as workers leave you good reviews</Item>
              <Item>Fee covers vetting, support, payments, and platform overhead</Item>
            </ul>
            <Button asChild size="lg" className="mt-8 w-full">
              <Link to="/for-hiring">Post a job</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* EXAMPLE */}
      <section className="bg-muted/40 border-y border-border">
        <div className="container py-16">
          <div className="max-w-3xl mx-auto">
            <span className="eyebrow">An example</span>
            <h2 className="display-lg mt-3">What a typical job looks like</h2>
            <div className="mt-8 rounded-lg border border-border bg-card p-6 md:p-8">
              <div className="text-sm text-muted-foreground mb-4">Job posted: <strong className="text-foreground">1 worker, sod install, 8 hours, $25/hr → $200 job total</strong></div>

              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mt-2">New hirer + new worker</h3>
              <div className="divide-y divide-border mt-2">
                <Row label="Job total (worker's wage)" value="$25/hr × 8 hrs" amount="$200.00" />
                <Row label="Hirer service fee (15% — new)" value="On top of job total" amount="$30.00" />
                <Row label="Hirer pays total" value="" amount="$230.00" bold />
                <Row label="Worker platform cut (5% — new)" value="Taken from wage" amount="−$10.00" />
                <Row label="Worker takes home" value="" amount="$190.00" highlight />
              </div>

              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mt-8">Same job — top-rated hirer + top-rated worker</h3>
              <div className="divide-y divide-border mt-2">
                <Row label="Job total (worker's wage)" value="$25/hr × 8 hrs" amount="$200.00" />
                <Row label="Hirer service fee (10% — 5★)" value="On top of job total" amount="$20.00" />
                <Row label="Hirer pays total" value="" amount="$220.00" bold />
                <Row label="Worker platform cut (2% — 5★)" value="Taken from wage" amount="−$4.00" />
                <Row label="Worker takes home" value="" amount="$196.00" highlight />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Workers and hirers both see their current tier in their dashboard. No surprises — your rate updates as your reviews come in.
            </p>
          </div>
        </div>
      </section>

      {/* PROMISE */}
      <section className="container py-16">
        <div className="max-w-3xl mx-auto rounded-xl border border-primary/30 bg-primary/5 p-8 flex gap-5">
          <Star className="h-7 w-7 text-primary flex-shrink-0 mt-0.5 fill-primary" />
          <div>
            <h3 className="display-md text-xl">Why we built it this way</h3>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Every other platform charges flat fees that punish good workers and reward bad ones. We flipped it.
              Be reliable, do quality work, treat people right — and you'll pay the lowest fees on the platform.
              Slack off, no-show, or get bad reviews — your fees go up. The hirers feel the same pressure: pay on
              time, treat your workers well, and your service fee drops too.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container pb-16">
        <h2 className="display-md text-2xl mb-6">Pricing FAQ</h2>
        <div className="grid gap-4 max-w-3xl">
          <Faq q="What does a brand-new worker pay?">
            5% on completed jobs. That's the starting tier for everyone with no rating yet. After a few jobs with strong reviews, it can drop to 4%, 3%, or as low as 2%.
          </Faq>
          <Faq q="What does a brand-new hirer pay?">
            15% on top of the job total when you book. That's the starting tier for everyone with no worker reviews yet. After a few jobs where workers rate you well, it can drop to 12% or as low as 10%.
          </Faq>
          <Faq q="When am I charged?">
            Only when a job is booked and completed. Posting jobs, browsing jobs, and bidding are always free for everyone.
          </Faq>
          <Faq q="How is my rating calculated?">
            After every completed job, both sides leave a 1–5★ review. Your fee tier is based on your rolling average over recent jobs. The system updates as new reviews come in.
          </Faq>
          <Faq q="Are there subscriptions or hidden fees?">
            No. Pay-as-you-go only. No setup fees, no monthly fees, no posting fees, no payout fees. The percentage on completed jobs is the only fee, period.
          </Faq>
          <Faq q="What does the service fee cover?">
            Vetting (ID checks, reference calls, background consent), trust and safety, customer support, payment handling, platform development, and a small operating margin.
          </Faq>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-trust text-trust-foreground">
        <div className="container py-16 text-center">
          <h2 className="display-lg text-trust-foreground">Ready to get started?</h2>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg"><Link to="/apply">Apply as a worker — free</Link></Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-trust-foreground/30 text-trust-foreground hover:bg-trust-foreground/10 hover:text-trust-foreground">
              <Link to="/for-hiring">Post a job</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

function SlidingTable({ title, rows, accent }: { title: string; rows: { tier: string; fee: string; note: string }[]; accent: "success" | "primary" }) {
  const accentClass = accent === "success" ? "text-success" : "text-primary";
  const bgClass = accent === "success" ? "bg-success/10" : "bg-primary/10";
  return (
    <div className="mt-6 rounded-lg border border-border bg-background/60 overflow-hidden">
      <div className={`px-4 py-2 text-xs uppercase tracking-wider font-bold ${bgClass} ${accentClass}`}>
        {title}
      </div>
      <div className="divide-y divide-border">
        {rows.map((r) => {
          const isDefault = r.note === "Default starting rate";
          return (
            <div key={r.tier} className={`flex items-center justify-between px-4 py-2.5 text-sm ${isDefault ? "bg-muted/50" : ""}`}>
              <div>
                <div className={`font-medium ${isDefault ? "font-bold" : ""}`}>{r.tier}</div>
                {r.note && <div className="text-xs text-muted-foreground mt-0.5">{r.note}</div>}
              </div>
              <div className={`font-bold ${accentClass}`}>{r.fee}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  );
}

function Row({ label, value, amount, bold, highlight }: { label: string; value: string; amount: string; bold?: boolean; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-3 ${highlight ? "bg-success/10 -mx-6 px-6 rounded" : ""}`}>
      <div>
        <div className={`${bold ? "font-bold" : "font-medium"} text-sm ${highlight ? "text-success" : ""}`}>{label}</div>
        {value && <div className="text-xs text-muted-foreground mt-0.5">{value}</div>}
      </div>
      <div className={`${bold || highlight ? "display-md text-xl" : "text-base font-semibold"} ${highlight ? "text-success" : ""}`}>{amount}</div>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="font-bold">{q}</h3>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{children}</p>
    </div>
  );
}

export default Pricing;
