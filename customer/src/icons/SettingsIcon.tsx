
interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  color?: string;
}

export function SettingsIcon({ size = 24, className, strokeWidth = 2.25, color }: IconProps) {
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
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v3.5M12 19.5V23M3.7 5.3l2.5 2.5M17.8 16.2l2.5 2.5M1 12h3.5M19.5 12H23M3.7 18.7l2.5-2.5M17.8 7.8l2.5-2.5"/>
    </svg>
  );
}
