import { ReactNode } from 'react';

const CREAM = '#F7F1E5';
const INK = '#0E0E0C';
const ASH = '#54524C';
const ORANGE = '#FF5A1F';
const PETAL_CREAM = '#F0E5D0';

export const BRAND = {
  cream: CREAM,
  ink: INK,
  ash: ASH,
  orange: ORANGE,
  petal: PETAL_CREAM,
  manrope: "'Manrope', system-ui, -apple-system, sans-serif",
  fraunces: "'Fraunces', Georgia, serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;

export function FlowerMark({ size = 96 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ animation: 'lh-pulse 4s ease-in-out infinite' }}
    >
      <g transform="translate(256 256)">
        <g fill={PETAL_CREAM}>
          <ellipse cx="0" cy="-141" rx="36" ry="107" />
          <ellipse cx="0" cy="-141" rx="36" ry="107" transform="rotate(45)" />
          <ellipse cx="0" cy="-141" rx="36" ry="107" transform="rotate(90)" />
          <ellipse cx="0" cy="-141" rx="36" ry="107" transform="rotate(135)" />
          <ellipse cx="0" cy="-141" rx="36" ry="107" transform="rotate(180)" />
          <ellipse cx="0" cy="-141" rx="36" ry="107" transform="rotate(225)" />
          <ellipse cx="0" cy="-141" rx="36" ry="107" transform="rotate(270)" />
          <ellipse cx="0" cy="-141" rx="36" ry="107" transform="rotate(315)" />
        </g>
        <circle cx="0" cy="0" r="34" fill={ORANGE} />
      </g>
    </svg>
  );
}

const PETAL_FIELD = [
  { x: '6%',  y: '11%', w: 38, h: 70, r: 22 },
  { x: '14%', y: '63%', w: 30, h: 56, r: -18 },
  { x: '78%', y: '15%', w: 36, h: 66, r: 38 },
  { x: '88%', y: '52%', w: 28, h: 52, r: -28 },
  { x: '50%', y: '88%', w: 32, h: 60, r: 12 },
  { x: '36%', y: '4%',  w: 24, h: 44, r: -42 },
  { x: '92%', y: '86%', w: 20, h: 38, r: 28 },
  { x: '2%',  y: '46%', w: 22, h: 42, r: 60 },
  { x: '60%', y: '20%', w: 18, h: 32, r: -8 },
  { x: '24%', y: '80%', w: 26, h: 48, r: 70 },
];

export function PetalScatter() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {PETAL_FIELD.map((p, i) => (
        <svg
          key={i}
          viewBox="0 0 40 70"
          width={p.w}
          height={p.h}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            opacity: 0.2,
            transform: `rotate(${p.r}deg)`,
          }}
        >
          <ellipse cx="20" cy="35" rx="11" ry="32" fill={PETAL_CREAM} />
        </svg>
      ))}
    </div>
  );
}

export function BrandShell({
  eyebrow,
  headline,
  subhead,
  children,
  footer,
}: {
  eyebrow?: string;
  headline: string;
  subhead: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <>
      <style>{`
        @keyframes lh-pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.04); }
        }
        .lh-line-input {
          background: transparent;
          border: 0;
          border-bottom: 1px solid rgba(14,14,12,0.18);
          padding: 10px 0;
          font-size: 15px;
          font-family: ${BRAND.manrope};
          color: ${BRAND.ink};
          width: 100%;
          outline: none;
          transition: border-color 180ms ease;
        }
        .lh-line-input:focus {
          border-bottom-color: ${BRAND.orange};
        }
        .lh-line-input::placeholder {
          color: rgba(14,14,12,0.35);
        }
      `}</style>

      <PetalScatter />

      <div
        className="min-h-screen flex items-center justify-center px-5"
        style={{
          position: 'relative',
          zIndex: 1,
          backgroundColor: BRAND.cream,
          color: BRAND.ink,
          fontFamily: BRAND.manrope,
        }}
      >
        <div className="w-full max-w-sm py-12">
          <div className="mb-10 flex flex-col items-center text-center gap-4">
            <FlowerMark size={88} />
            {eyebrow ? (
              <span
                className="uppercase tracking-[0.18em]"
                style={{
                  fontSize: 11,
                  fontFamily: BRAND.mono,
                  color: BRAND.ash,
                }}
              >
                {eyebrow}
              </span>
            ) : null}
            <h1
              style={{
                fontFamily: BRAND.manrope,
                fontWeight: 800,
                fontSize: 30,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                color: BRAND.ink,
              }}
            >
              {headline}
            </h1>
            <p
              style={{
                fontFamily: BRAND.fraunces,
                fontStyle: 'italic',
                fontSize: 17,
                lineHeight: 1.4,
                color: BRAND.ash,
                fontWeight: 400,
              }}
            >
              {subhead}
            </p>
          </div>

          {children}

          {footer ? <div className="mt-8">{footer}</div> : null}
        </div>
      </div>
    </>
  );
}
