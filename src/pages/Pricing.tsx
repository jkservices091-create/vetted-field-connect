import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, Hammer, Star, TrendingDown, Sparkles } from "lucide-react";

const Pricing = () => {
  return (
    <PublicLayout>
      {/* HERO */}
      <section className="bg-trust text-trust-foreground">
        <div className="container py-16 md:py-20">
          <span className="eyebrow">Pricing</span>
          <h1 className="display-xl mt-4 text-trust-foreground max-w-3xl">
            Predictable plans. <span className="text-primary">Better ratings = better rates.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-trust-foreground/75 text-lg">
            Simple monthly subscriptions on both sides. Hirers earn discounts on their plan with great worker reviews. Workers keep more of every paycheck as their ratings climb.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-trust-foreground/70">
            <span className="flex items-center gap-1.5"><TrendingDown className="h-4 w-4 text-primary" /> Up to 20% off for top-rated hirers</span>
            <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-primary" /> Top workers keep 98% of their wage</span>
            <span className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-primary" /> No per-job booking fees</span>
          </div>
        </div>
      </section>

      {/* HIRER TIERS */}
      <section className="container py-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="eyebrow">For hirers — contractors, builders, landscapers</span>
          </div>
          <h2 className="display-lg mt-3">Pick a plan that fits how often you hire.</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Pay one monthly subscription. No per-job booking fee, no percentage on the wage. The better your worker reviews, the lower your monthly rate — up to <strong className="text-foreground">20% off</strong>.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <HirerTier name="Starter" price="$29" jobs="1 active job" features={["Free 30-day trial", "Full worker vetting access", "In-app messaging", "Two-way reviews"]} />
            <HirerTier name="Builder" price="$79" jobs="5 active jobs" features={["Everything in Starter", "Priority worker matching", "Saved worker shortlist"]} popular />
            <HirerTier name="Crew" price="$199" jobs="15 active jobs" features={["Everything in Builder", "Multi-user team access", "Bulk job posting"]} />
            <HirerTier name="Unlimited" price="$399" jobs="Unlimited jobs" features={["Everything in Crew", "Dedicated account manager", "API + custom workflows"]} />
          </div>

          {/* Hirer rating discount */}
          <div className="mt-10 rounded-xl border border-primary/30 bg-primary/5 p-6 md:p-8">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-6 w-6 text-primary" />
              <h3 className="display-md text-xl">Earn discounts with your worker reviews</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">After every completed job, the worker rates you. Your rolling rating sets your monthly discount on whichever plan you're on.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <DiscountCard rating="5★ — Trusted Hirer" discount="20% off" example="$199 Crew → $159.20/mo" highlight />
              <DiscountCard rating="4★" discount="10% off" example="$199 Crew → $179.10/mo" />
              <DiscountCard rating="New / 3★ and below" discount="Full price" example="Default starting rate" />
            </div>
          </div>

          <div className="mt-8">
            <Button asChild size="lg"><Link to="/for-hiring">Start hiring — 30-day free trial</Link></Button>
          </div>
        </div>
      </section>

      {/* WORKER PLAN */}
      <section className="bg-muted/40 border-y border-border">
        <div className="container py-16">
          <div className="max-w-5xl mx-auto grid gap-10 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Hammer className="h-5 w-5 text-success" />
                <span className="eyebrow">For workers — laborers & crews</span>
              </div>
              <h2 className="display-lg mt-3">$15/month. Locked in.</h2>
              <p className="mt-3 text-muted-foreground">
                One flat subscription gets you a verified profile, unlimited bidding on every job in your area, and direct messaging with hirers. Your rating decides how much of each paycheck you keep.
              </p>

              <div className="mt-6 rounded-2xl border-2 border-success/40 bg-success/5 p-8">
                <div className="flex items-baseline gap-2">
                  <span className="display-xl text-success">$15</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Free 30-day trial. Cancel anytime.</p>
                <ul className="mt-6 space-y-3 text-sm">
                  <Item>Verified profile + ID & reference check</Item>
                  <Item>Unlimited browsing and bidding</Item>
                  <Item>Direct in-app messaging with hirers</Item>
                  <Item>Two-way reviews — build your reputation</Item>
                  <Item>Earn Verified Pro and Top Hand status</Item>
                </ul>
                <Button asChild size="lg" className="mt-8 w-full bg-success hover:bg-success/90 text-success-foreground">
                  <Link to="/apply">Apply as a worker</Link>
                </Button>
              </div>
            </div>

            <div>
              <div className="rounded-xl border border-border bg-card p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <Star className="h-6 w-6 text-success fill-success" />
                  <h3 className="display-md text-xl">Your rating sets your take-home</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  When a job pays out, FieldHands takes a small sliding cut. The better your reviews, the more you keep.
                </p>

                <div className="mt-5 rounded-lg border border-border overflow-hidden">
                  <SlidingRow rating="5★ — Top Hand" cut="2%" keep="98%" highlight />
                  <SlidingRow rating="4★ — Verified Pro" cut="4%" keep="96%" />
                  <SlidingRow rating="New worker" cut="5%" keep="95%" isDefault />
                  <SlidingRow rating="3★" cut="6%" keep="94%" />
                  <SlidingRow rating="2★" cut="8%" keep="92%" />
                  <SlidingRow rating="1★" cut="10%" keep="90%" />
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                  Your current cut is always shown clearly in your dashboard, before you bid on any job.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EXAMPLE */}
      <section className="container py-16">
        <div className="max-w-3xl mx-auto">
          <span className="eyebrow">An example</span>
          <h2 className="display-lg mt-3">What a typical job looks like</h2>
          <div className="mt-8 rounded-lg border border-border bg-card p-6 md:p-8">
            <div className="text-sm text-muted-foreground mb-4">Job posted: <strong className="text-foreground">1 worker, sod install, 8 hours, $25/hr → $200 wage</strong></div>

            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mt-2">New hirer (Builder $79/mo) + new worker</h3>
            <div className="divide-y divide-border mt-2">
              <Row label="Worker's wage" value="$25/hr × 8 hrs" amount="$200.00" />
              <Row label="Hirer's monthly cost" value="Builder plan, no discount yet" amount="$79.00/mo" />
              <Row label="Worker's monthly cost" value="Flat subscription" amount="$15.00/mo" />
              <Row label="Worker platform cut (5% — new)" value="Taken from this job's wage" amount="−$10.00" />
              <Row label="Worker takes home (this job)" value="" amount="$190.00" highlight />
            </div>

            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mt-8">Same job — top-rated hirer + top-rated worker</h3>
            <div className="divide-y divide-border mt-2">
              <Row label="Worker's wage" value="$25/hr × 8 hrs" amount="$200.00" />
              <Row label="Hirer's monthly cost" value="Builder plan, 20% off (5★)" amount="$63.20/mo" />
              <Row label="Worker's monthly cost" value="Flat subscription" amount="$15.00/mo" />
              <Row label="Worker platform cut (2% — 5★)" value="Taken from this job's wage" amount="−$4.00" />
              <Row label="Worker takes home (this job)" value="" amount="$196.00" highlight />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No per-job booking fees. The subscription IS the platform cost — both sides see exactly what they're paying upfront.
          </p>
        </div>
      </section>

      {/* PROMISE */}
      <section className="bg-muted/40 border-y border-border">
        <div className="container py-16">
          <div className="max-w-3xl mx-auto rounded-xl border border-primary/30 bg-primary/5 p-8 flex gap-5">
            <Star className="h-7 w-7 text-primary flex-shrink-0 mt-0.5 fill-primary" />
            <div>
              <h3 className="display-md text-xl">Why ratings drive everything</h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Most platforms charge the same fee whether you're great or terrible to work with. We don't.
                Hirers who pay on time and treat workers right earn discounts on their subscription.
                Workers who show up and do quality work keep more of every paycheck. The platform rewards
                the people making it work — on both sides.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container py-16">
        <h2 className="display-md text-2xl mb-6">Pricing FAQ</h2>
        <div className="grid gap-4 max-w-3xl">
          <Faq q="Is there a free trial?">
            Yes — both hirers and workers get a 30-day free trial on any plan. Cancel anytime before the trial ends and you won't be charged.
          </Faq>
          <Faq q="What does a brand-new hirer pay?">
            Whichever plan tier you pick — at full price — until you build up worker reviews. After enough completed jobs, your rolling rating unlocks 10% off (4★) or 20% off (5★) the plan price.
          </Faq>
          <Faq q="What does a brand-new worker pay?">
            $15/month flat. New workers also pay a 5% platform cut on completed-job payouts until they have a rating. After a few good reviews, that cut can drop to 4% or as low as 2% for top performers.
          </Faq>
          <Faq q="Are there per-job booking fees?">
            No. The subscription IS the cost. Hirers don't pay a fee on top of the wage. Workers don't pay any application or per-bid fees. The only thing on top of the subscription is the small sliding cut from each worker payout.
          </Faq>
          <Faq q="What happens if I exceed my hirer plan's job limit?">
            You can upgrade anytime — the change is prorated. Or post the additional job after one of your active jobs closes.
          </Faq>
          <Faq q="How is my rating calculated?">
            After every completed job, both sides leave a 1–5★ review. Your fee tier (worker) or plan discount (hirer) is based on your rolling average. New reviews update your tier automatically.
          </Faq>
          <Faq q="What does the subscription cover?">
            Vetting (ID checks, reference calls, background consent), trust and safety, customer support, payment handling, in-app messaging, ratings system, and platform development.
          </Faq>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-trust text-trust-foreground">
        <div className="container py-16 text-center">
          <h2 className="display-lg text-trust-foreground">Ready to get started?</h2>
          <p className="mt-3 text-trust-foreground/75 max-w-xl mx-auto">30-day free trial on any plan. Cancel anytime.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg"><Link to="/apply">Apply as a worker — $15/mo</Link></Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-trust-foreground/30 text-trust-foreground hover:bg-trust-foreground/10 hover:text-trust-foreground">
              <Link to="/for-hiring">Hirer plans — from $29/mo</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

function HirerTier({ name, price, jobs, features, popular }: { name: string; price: string; jobs: string; features: string[]; popular?: boolean }) {
  return (
    <div className={`relative rounded-xl border-2 p-6 flex flex-col ${popular ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
          Most popular
        </div>
      )}
      <h3 className="display-md text-xl">{name}</h3>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="display-xl text-3xl">{price}</span>
        <span className="text-sm text-muted-foreground">/mo</span>
      </div>
      <p className="text-sm text-muted-foreground mt-1">{jobs}</p>
      <ul className="mt-5 space-y-2 text-sm flex-1">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DiscountCard({ rating, discount, example, highlight }: { rating: string; discount: string; example: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-4 border ${highlight ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
      <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground">{rating}</div>
      <div className={`display-md text-2xl mt-1 ${highlight ? "text-primary" : ""}`}>{discount}</div>
      <div className="text-xs text-muted-foreground mt-1">{example}</div>
    </div>
  );
}

function SlidingRow({ rating, cut, keep, highlight, isDefault }: { rating: string; cut: string; keep: string; highlight?: boolean; isDefault?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 text-sm border-b border-border last:border-b-0 ${highlight ? "bg-success/10" : isDefault ? "bg-muted/50" : ""}`}>
      <div className={`${highlight || isDefault ? "font-bold" : "font-medium"}`}>{rating}</div>
      <div className="flex items-center gap-4">
        <div className="text-xs text-muted-foreground">cut <span className="font-bold text-foreground">{cut}</span></div>
        <div className={`font-bold ${highlight ? "text-success" : ""}`}>keep {keep}</div>
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
