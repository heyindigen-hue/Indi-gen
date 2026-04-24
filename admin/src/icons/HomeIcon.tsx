
interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  color?: string;
}

export function HomeIcon({ size = 24, className, strokeWidth = 2.25, color }: IconProps) {
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
      <path d="M3 10L12 3L21 10V20Q21 21 20 21H15V15Q15 14 14 14H10Q9 14 9 15V21H4Q3 21 3 20Z"/>
      <path d="M3 10L12 3L21 10"/>
    </svg>
  );
}
