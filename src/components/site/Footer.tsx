export const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container-tight py-12">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight">
              <span className="grid h-8 w-8 place-items-center bg-primary text-primary-foreground shadow-amber">
                <span className="font-mono text-sm font-bold">F</span>
              </span>
              <span>FIELD<span className="text-primary">HANDS</span></span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Vetted field labor and runner services. Built around opportunity, accountability, and quality.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm sm:grid-cols-3">
            {[
              { h: "Platform", l: ["How it works", "Lanes", "Vetting", "Tiers"] },
              { h: "Workers", l: ["Apply", "Fair chance", "Top Hands"] },
              { h: "Hiring", l: ["Post a job", "Request runner", "Pricing"] },
            ].map(group => (
              <div key={group.h}>
                <div className="font-mono text-xs uppercase tracking-wider text-primary">{group.h}</div>
                <ul className="mt-3 space-y-1.5">
                  {group.l.map(item => (
                    <li key={item}>
                      <a href="#" className="text-muted-foreground transition-colors hover:text-foreground">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} FieldHands. Built for the field.</p>
          <p className="font-mono uppercase tracking-wider">Pilot · TX · v0.1</p>
        </div>
      </div>
    </footer>
  );
};
