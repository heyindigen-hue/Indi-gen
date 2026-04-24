
interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  color?: string;
}

export function VibrateIcon({ size = 24, className, strokeWidth = 2.25, color }: IconProps) {
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
      <path d="M6 2H18Q19 2 19 3V21Q19 22 18 22H6Q5 22 5 21V3Q5 2 6 2Z"/>
      <path d="M1 10V14M23 10V14M3 7V17M21 7V17"/>
    </svg>
  );
}
