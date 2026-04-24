
interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  color?: string;
}

export function FileTextIcon({ size = 24, className, strokeWidth = 2.25, color }: IconProps) {
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
      <path d="M14 2H6Q5 2 4 3V21Q4 22 5 22H19Q20 22 20 21V8L14 2Z"/>
      <path d="M14 2V8H20"/>
      <path d="M8 13H16M8 17H16M8 9H10"/>
    </svg>
  );
}
