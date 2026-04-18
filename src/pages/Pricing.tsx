import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, Hammer, Heart } from "lucide-react";

const Pricing = () => {
  return (
    <PublicLayout>
      {/* HERO */}
      <section className="bg-trust text-trust-foreground">
        <div className="container py-16 md:py-20">
          <span className="eyebrow">Pricing</span>
          <h1 className="display-xl mt-4 text-trust-foreground max-w-3xl">
            Workers <span className="text-primary">always free.</span><br />
            Hirers pay only when they book.
          </h1>
          <p className="mt-6 max-w-2xl text-trust-foreground/75 text-lg">
            The people doing the work shouldn't pay to find work. The people with the budget cover the cost of the platform — and only when they actually hire someone.
          </p>
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
            <div className="display-xl text-success">$0</div>
            <p className="text-sm text-muted-foreground mt-2">Forever. No catch.</p>
            <ul className="mt-6 space-y-3 text-sm">
              <Item>Free signup and profile</Item>
              <Item>Free verification and ID review</Item>
              <Item>Free to browse every job</Item>
              <Item>Free to apply and bid — no limits</Item>
              <Item>Keep <strong>100% of your wage</strong> — we never take a cut</Item>
              <Item>No subscription. No application fees. No hidden charges.</Item>
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
              <span className="display-xl text-primary">10%</span>
              <span className="text-muted-foreground">service fee on bookings</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Free to post. Pay only when you book a worker.</p>
            <ul className="mt-6 space-y-3 text-sm">
              <Item>Free company profile and unlimited job posts</Item>
              <Item>Free to review bids and message workers</Item>
              <Item>Charged <strong>10% on top of the worker's wage</strong> only when you book</Item>
              <Item>Worker still gets 100% of their agreed wage</Item>
              <Item>No subscription. No posting fees. No hidden charges.</Item>
              <Item>Fee covers vetting, support, payments, and platform operations</Item>
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
              <div className="text-sm text-muted-foreground mb-4">Hirer posts: <strong className="text-foreground">2 laborers, sod install, 8 hours, $25/hr</strong></div>
              <div className="divide-y divide-border">
                <Row label="Worker's wage" value="$25/hr × 8 hrs × 2 workers" amount="$400.00" />
                <Row label="FieldHands service fee (10%)" value="Charged to the hirer only" amount="$40.00" />
                <Row label="Hirer pays total" value="" amount="$440.00" bold />
                <Row label="Each worker takes home" value="100% of their agreed wage" amount="$200.00" highlight />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Workers always know what they're earning before they bid. No surprises, no deductions.
            </p>
          </div>
        </div>
      </section>

      {/* PROMISE */}
      <section className="container py-16">
        <div className="max-w-3xl mx-auto rounded-xl border border-primary/30 bg-primary/5 p-8 flex gap-5">
          <Heart className="h-7 w-7 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="display-md text-xl">Why workers stay free</h3>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Field workers are already grinding. The last thing they need is another app taking a cut.
              FieldHands was built so the people putting in the labor never have to come out of pocket
              to find work. The hirers — who have the budget and need the service — cover the platform.
              That's the promise. That's the model. It's not changing.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container pb-16">
        <h2 className="display-md text-2xl mb-6">Pricing FAQ</h2>
        <div className="grid gap-4 max-w-3xl">
          <Faq q="Are there any hidden fees for workers?">
            No. Zero. Workers pay nothing — ever. No application fees, no subscriptions, no per-bid fees, no payout fees, no cut taken from your wage.
          </Faq>
          <Faq q="When does the hirer get charged the 10% fee?">
            Only when a hirer books a worker. Posting jobs and reviewing bids is always free. If you post a job and don't book anyone, you owe nothing.
          </Faq>
          <Faq q="Is the 10% taken from the worker's wage?">
            No. The fee is added on top of the worker's wage. If you agree on $25/hr, the worker gets the full $25/hr and the hirer pays $27.50/hr total.
          </Faq>
          <Faq q="Are there subscription tiers?">
            No subscriptions. Pay-as-you-go only. Use FieldHands once a year or once a week — same simple model.
          </Faq>
          <Faq q="What does the service fee cover?">
            Vetting (ID checks, reference calls, background consent), trust and safety, customer support, payment handling, and platform development.
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
