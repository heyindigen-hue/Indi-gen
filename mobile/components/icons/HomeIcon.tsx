import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function HomeIcon({ size = 24, color = '#000000', strokeWidth = 2.25 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 10L12 3L21 10V20Q21 21 20 21H15V15Q15 14 14 14H10Q9 14 9 15V21H4Q3 21 3 20Z" />
      <Path d="M3 10L12 3L21 10" />
    </Svg>
  );
}
