import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function SearchIcon({ size = 24, color = '#000000', strokeWidth = 2.25 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="10.5" cy="10.5" r="6.5" />
      <Path d="M15.5 15.5L21 21" />
    </Svg>
  );
}
