export default function GrainOverlay() {
  return (
    <>
      <svg className="fixed inset-0 w-0 h-0 pointer-events-none" aria-hidden>
        <filter id="lh-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0.65 0"
          />
        </filter>
      </svg>
      <div
        className="grain-overlay"
        aria-hidden
        style={{
          backgroundColor: 'transparent',
          filter: 'url(#lh-grain)',
        }}
      />
    </>
  );
}
