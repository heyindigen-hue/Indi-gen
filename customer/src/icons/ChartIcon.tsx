
interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  color?: string;
}

export function ChartIcon({ size = 24, className, strokeWidth = 2.25, color }: IconProps) {
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
      <rect x="4" y="12" width="4" height="8" rx="1.5" fill="currentColor" fillOpacity="0.9" stroke="none"/>
      <rect x="10" y="6" width="4" height="14" rx="1.5" fill="currentColor" fillOpacity="0.9" stroke="none"/>
      <rect x="16" y="9" width="4" height="11" rx="1.5" fill="currentColor" fillOpacity="0.9" stroke="none"/>
    </svg>
  );
}
