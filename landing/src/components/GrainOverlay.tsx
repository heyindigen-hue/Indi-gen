import { useMemo } from 'react';

const NOISE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" seed="3"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`;

export default function GrainOverlay() {
  const url = useMemo(
    () => `url("data:image/svg+xml;utf8,${encodeURIComponent(NOISE_SVG)}")`,
    []
  );
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 60,
        opacity: 0.04,
        mixBlendMode: 'overlay',
        backgroundImage: url,
        backgroundRepeat: 'repeat',
        backgroundSize: '240px 240px',
        transform: 'translateZ(0)',
        willChange: 'transform',
      }}
    />
  );
}
