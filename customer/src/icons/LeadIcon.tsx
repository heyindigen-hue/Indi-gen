
interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  color?: string;
}

export function LeadIcon({ size = 24, className, strokeWidth = 2.25, color }: IconProps) {
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
      <path d="M12 3C14 6 16 8 16 11C16 13.5 14 15 12 15C10 15 8 13.5 8 11C8 8 10 6 12 3Z"/>
      <line x1="12" y1="15" x2="12" y2="21"/>
      <line x1="8.5" y1="19" x2="15.5" y2="19"/>
    </svg>
  );
}
