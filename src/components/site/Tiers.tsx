import { Crown } from "lucide-react";

const tiers = [
  { code: "T0", name: "Applicant", desc: "Account created. No job access yet.", access: "0%" },
  { code: "T1", name: "Pending review", desc: "Docs and references in. Awaiting screening.", access: "10%" },
  { code: "T2", name: "Verified", desc: "Cleared the gate. Bidding and standard jobs unlocked.", access: "55%" },
  { code: "T3", name: "Verified Pro", desc: "Strong reviews + repeat hires. Higher-trust jobs.", access: "80%" },
  { code: "T4", name: "Top Hands", desc: "Elite tier. Invite-only meetups. First look at premium jobs.", access: "100%", elite: true },
];

export const Tiers = () => {
  return (
    <section id="tiers" className="relative border-t border-border bg-gradient-steel py-24 sm:py-32">
      <div className="container-tight">
        <div className="mb-14 max-w-2xl">
          <span className="label-stamp">04 / Tiers</span>
          <h2 className="mt-3 font-display text-4xl font-semibold uppercase leading-tight sm:text-5xl">
            Earn your access.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Tier progression is driven by references, test performance, completed jobs, and two-way reviews. Cut corners, lose ground. Show up sharp, climb fast.
          </p>
        </div>

        <div className="overflow-hidden border border-border bg-surface">
          {tiers.map((t, i) => (
            <div
              key={t.code}
              className={`group grid grid-cols-[64px,1fr] items-center gap-4 border-b border-border px-5 py-5 transition-colors last:border-b-0 hover:bg-surface-elevated sm:grid-cols-[80px,200px,1fr,140px] sm:gap-6 sm:px-7 ${t.elite ? 'bg-primary/[0.04]' : ''}`}
            >
              <div className={`font-mono text-2xl font-bold sm:text-3xl ${t.elite ? 'text-primary' : 'text-muted-foreground'}`}>
                {t.code}
              </div>
              <div className="col-span-1 sm:col-auto">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-semibold uppercase">{t.name}</h3>
                  {t.elite && <Crown className="h-4 w-4 text-primary" />}
                </div>
              </div>
              <p className="col-span-2 text-sm text-muted-foreground sm:col-auto">{t.desc}</p>
              <div className="col-span-2 sm:col-auto">
                <div className="flex items-center justify-between font-mono text-xs text-muted-foreground sm:justify-end sm:gap-3">
                  <span>Access</span>
                  <span className={`font-bold ${t.elite ? 'text-primary' : 'text-foreground'}`}>{t.access}</span>
                </div>
                <div className="mt-1.5 h-1 w-full bg-border sm:w-32">
                  <div
                    className={`h-full ${t.elite ? 'bg-primary' : 'bg-steel-400'}`}
                    style={{ width: t.access }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
