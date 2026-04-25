const LOGOS = [
  'NORTHWIND', 'ATLAS LABS', 'KINOKO', 'TIDAL.IO', 'MERIDIAN',
  'WAYPOINT', 'LANTERN', 'ORYZA', 'FOUNDRY 9', 'PARALLAX',
  'COLDBREW', 'AURELIA',
];

export default function ProofTicker() {
  return (
    <section className="py-20 md:py-28 border-y border-[var(--line)] overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-6 md:px-10">
        <div className="font-mono-brand text-[12px] uppercase tracking-[0.12em] text-[var(--ink-soft)] text-center mb-10">
          [ HUNTED BY 1,200+ TEAMS ]
        </div>
      </div>
      <div className="overflow-hidden relative">
        <div className="proof-track flex items-center">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center gap-16 md:gap-24 pr-16 md:pr-24 shrink-0" aria-hidden={dup === 1}>
              {LOGOS.map((logo, i) => (
                <Logo key={`${dup}-${i}`} text={logo} />
              ))}
            </div>
          ))}
        </div>
        <style>{`
          .proof-track { width: max-content; animation: lh-proof 60s linear infinite; }
          @keyframes lh-proof {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          @media (prefers-reduced-motion: reduce) {
            .proof-track { animation: none; }
          }
        `}</style>
      </div>
    </section>
  );
}

function Logo({ text }: { text: string }) {
  return (
    <a
      href="#"
      className="relative font-display font-semibold tracking-[-0.02em] text-[24px] md:text-[28px] text-[var(--ink-soft)] grayscale hover:grayscale-0 hover:text-[#14140F] transition-colors duration-300 group whitespace-nowrap inline-block py-1"
      data-cursor
      data-cursor-label="View"
    >
      {text}
      <span className="absolute left-0 right-0 bottom-0 h-[2px] origin-left scale-x-0 group-hover:scale-x-100 bg-[#FF5A1F] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" />
    </a>
  );
}
