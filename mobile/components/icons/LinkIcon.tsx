import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function LinkIcon({ size = 24, color = '#000000', strokeWidth = 2.25 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10 13C10.55 13.73 11.26 14.34 12.09 14.78C12.92 15.22 13.84 15.48 14.79 15.54C15.73 15.6 16.68 15.46 17.57 15.13C18.46 14.8 19.27 14.28 19.94 13.61L21.94 11.61C23.12 10.39 23.77 8.74 23.75 7.03C23.73 5.33 23.04 3.69 21.83 2.5C20.62 1.31 18.97 0.65 17.27 0.66C15.56 0.67 13.92 1.35 12.73 2.56L11.38 3.9M14 11C13.45 10.27 12.74 9.66 11.91 9.22C11.08 8.78 10.16 8.52 9.21 8.46C8.27 8.4 7.32 8.54 6.43 8.87C5.54 9.2 4.73 9.72 4.06 10.39L2.06 12.39C0.88 13.61 0.23 15.26 0.25 16.97C0.27 18.67 0.96 20.31 2.17 21.5C3.38 22.69 5.03 23.35 6.73 23.34C8.44 23.33 10.08 22.65 11.27 21.44L12.61 20.1" />
    </Svg>
  );
}
