
interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  color?: string;
}

export function RefreshIcon({ size = 24, className, strokeWidth = 2.25, color }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M23 4V10H17"/>
      <path d="M1 20V14H7"/>
      <path d="M3.51 9A9 9 0 0120.49 15"/>
      <path d="M20.49 15A9 9 0 013.51 9"/>
    </svg>
  );
}
