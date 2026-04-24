
interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  color?: string;
}

export function LogOutIcon({ size = 24, className, strokeWidth = 2.25, color }: IconProps) {
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
      <path d="M9 21H5Q4 21 3 20V4Q3 3 4 3H9"/>
      <path d="M16 17L21 12L16 7"/>
      <path d="M21 12H9"/>
    </svg>
  );
}
