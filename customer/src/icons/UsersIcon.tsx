
interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  color?: string;
}

export function UsersIcon({ size = 24, className, strokeWidth = 2.25, color }: IconProps) {
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
      <circle cx="8" cy="8" r="3.5"/>
      <path d="M1 21C1 17.5 4.2 15 8 15"/>
      <circle cx="16" cy="8" r="3.5"/>
      <path d="M13 15C16.8 15 20 17.5 20 21"/>
      <path d="M11 21C11 17.5 8 15 8 15"/>
    </svg>
  );
}
