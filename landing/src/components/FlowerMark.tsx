interface Props {
  size?: number;
  petal?: string;
  core?: string;
  className?: string;
}

/** The Indi-gen flower mark — 8 petals around an orange core. Inline so it can be themed. */
export default function FlowerMark({
  size = 32,
  petal = 'currentColor',
  core = '#FF5A1F',
  className,
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={className}
      fill="none"
      aria-hidden
    >
      <g transform="translate(256 256)">
        <g fill={petal}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <ellipse
              key={deg}
              cx="0"
              cy="-141"
              rx="36"
              ry="107"
              transform={`rotate(${deg})`}
            />
          ))}
          <circle cx="0" cy="0" r="26" fill={core} />
        </g>
      </g>
    </svg>
  );
}
