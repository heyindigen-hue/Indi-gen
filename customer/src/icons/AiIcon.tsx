
interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  color?: string;
}

export function AiIcon({ size = 24, className, strokeWidth = 2.25, color }: IconProps) {
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
      <path d="M12 2C12 2 13.5 7 12 12C10.5 7 12 2 12 2Z"/>
      <path d="M22 12C22 12 17 13.5 12 12C17 10.5 22 12 22 12Z"/>
      <path d="M12 22C12 22 10.5 17 12 12C13.5 17 12 22 12 22Z"/>
      <path d="M2 12C2 12 7 10.5 12 12C7 13.5 2 12 2 12Z"/>
    </svg>
  );
}
