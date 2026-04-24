
interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  color?: string;
}

export function TrashIcon({ size = 24, className, strokeWidth = 2.25, color }: IconProps) {
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
      <path d="M3 6H21"/>
      <path d="M19 6L18 20Q18 21 17 21H7Q6 21 6 20L5 6"/>
      <path d="M10 11V16M14 11V16"/>
      <path d="M9 6V4Q9 3 10 3H14Q15 3 15 4V6"/>
    </svg>
  );
}
