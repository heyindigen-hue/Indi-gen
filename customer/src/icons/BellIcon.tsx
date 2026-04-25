
interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  color?: string;
}

export function BellIcon({ size = 24, className, strokeWidth = 2.25, color }: IconProps) {
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
      <path d="M18 8A6 6 0 006 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"/>
      <path d="M13.73 21C13.55 21.3 13.3 21.55 12.98 21.72C12.66 21.89 12.33 21.97 12 21.97C11.67 21.97 11.34 21.89 11.02 21.72C10.7 21.55 10.45 21.3 10.27 21"/>
    </svg>
  );
}
