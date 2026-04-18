import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How does pricing work?",
    a: "Hiring parties carry most of the platform fee — they're the ones getting vetted, screened people who actually show up. Workers pay a low onboarding fee (which helps cover background checks and profile review) and a minimal success fee on completed jobs. We also earn through booking fees, premium accounts, meetup tickets, and sponsor packages. The model is buyer-weighted on purpose.",
  },
  {
    q: "What's included in the background check?",
    a: "Identity verification, criminal history (lane-appropriate scope), and consent-based screening — handled through a vetted screening provider. The cost is rolled into the worker's onboarding fee so there are no surprise charges later. We're transparent that screening costs money; that's part of the reason FieldHands is worth using.",
  },
  {
    q: "What's the fair-chance hiring policy?",
    a: "Records aren't an automatic disqualifier. Workers with histories can be matched only with hiring parties who opt in to fair-chance hiring. Permanent exclusions apply to offenses involving harm to minors. We also connect fair-chance workers to legal aid, expungement, and reentry resources — opportunity and standards aren't opposites.",
  },
  {
    q: "Do workers need insurance?",
    a: "Yes — workers carry their own insurance and upload a current Certificate of Insurance to get approved. Requirements scale by lane: general labor has a baseline, runners need vehicle and cargo coverage, and higher-risk lanes (hotshot, inspectors) require stricter coverage and may require a registered LLC.",
  },
  {
    q: "What is the Top Hands tier?",
    a: "Top Hands is the elite tier (T4). It's earned, not bought — through strong references, completed jobs, two-way reviews, judgment-test performance, and consistent reliability. Top Hands get first look at premium jobs, priority visibility to hiring parties, and invitations to invite-only contractor meetups. Cut corners and you lose the tier.",
  },
  {
    q: "How long does vetting take?",
    a: "It depends on how fast you submit references and clear documentation. Strong references plus complete docs can move through in days. Weak or missing references mean restricted or probationary access until you've built a track record on the platform.",
  },
];

export const Faq = () => {
  return (
    <section id="faq" className="relative py-24 sm:py-32">
      <div className="container-tight">
        <div className="mb-14 grid gap-10 md:grid-cols-[1fr,1.4fr] md:items-end">
          <div>
            <span className="label-stamp">06 / FAQ</span>
            <h2 className="mt-3 font-display text-4xl font-semibold uppercase leading-tight sm:text-5xl">
              Straight<br />answers.
            </h2>
          </div>
          <p className="text-muted-foreground">
            The most common questions from workers, contractors, and hiring parties before they sign up. Don't see yours? Hit the waitlist and ask — we answer every one.
          </p>
        </div>

        <Accordion
          type="single"
          collapsible
          className="overflow-hidden border border-border bg-surface"
        >
          {faqs.map((item, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border-b border-border last:border-b-0"
            >
              <AccordionTrigger className="group gap-4 px-5 py-6 text-left hover:no-underline sm:px-7">
                <div className="flex items-start gap-4 sm:gap-6">
                  <span className="font-mono text-xs text-primary sm:text-sm">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-lg font-semibold uppercase leading-snug tracking-tight sm:text-xl">
                    {item.q}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-7 sm:px-7">
                <div className="ml-0 max-w-2xl text-pretty text-muted-foreground sm:ml-12">
                  {item.a}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
