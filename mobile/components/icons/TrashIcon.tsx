import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function TrashIcon({ size = 24, color = '#000000', strokeWidth = 2.25 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 6H21M19 6L18 20Q18 21 17 21H7Q6 21 6 20L5 6M10 11V16M14 11V16M9 6V4Q9 3 10 3H14Q15 3 15 4V6" />
    </Svg>
  );
}
