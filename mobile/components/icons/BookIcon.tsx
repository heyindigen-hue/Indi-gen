import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function BookIcon({ size = 24, color = '#000000', strokeWidth = 2.25 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 19.5C4 18.1 5.1 17 6.5 17H20M6.5 2H20V22H6.5C5.1 22 4 20.9 4 19.5V4.5C4 3.1 5.1 2 6.5 2Z" />
    </Svg>
  );
}
