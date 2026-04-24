
interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  color?: string;
}

export function ShieldIcon({ size = 24, className, strokeWidth = 2.25, color }: IconProps) {
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
      <path d="M12 2L4 6V12C4 16.418 7.582 20 12 22C16.418 20 20 16.418 20 12V6L12 2Z"/>
    </svg>
  );
}
