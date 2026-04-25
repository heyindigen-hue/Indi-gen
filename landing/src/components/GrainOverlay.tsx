export default function GrainOverlay() {
  return (
    <>
      <svg className="fixed inset-0 w-0 h-0 pointer-events-none" aria-hidden>
        <filter id="lh-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" seed="3" />
          <feColorMatrix
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0.5 0"
          />
        </filter>
      </svg>
      <div
        className="fixed inset-0 pointer-events-none z-[80]"
        aria-hidden
        style={{
          opacity: 0.04,
          mixBlendMode: 'multiply',
          filter: 'url(#lh-grain)',
        }}
      />
    </>
  );
}
