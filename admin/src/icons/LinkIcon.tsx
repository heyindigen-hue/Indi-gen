
interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  color?: string;
}

export function LinkIcon({ size = 24, className, strokeWidth = 2.25, color }: IconProps) {
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
      <path d="M10 13A5 5 0 007.54 4.46L4.46 7.54A5 5 0 0010 13"/>
      <path d="M14 11A5 5 0 0116.46 19.54L19.54 16.46A5 5 0 0014 11"/>
      <path d="M8 16L16 8"/>
    </svg>
  );
}
