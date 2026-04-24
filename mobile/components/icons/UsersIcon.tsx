import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function UsersIcon({ size = 24, color = '#000000', strokeWidth = 2.25 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="8" cy="8" r="3.5" />
      <Path d="M1 21C1 17.5 4.2 15 8 15" />
      <Circle cx="16" cy="8" r="3.5" />
      <Path d="M13 15C16.8 15 20 17.5 20 21" />
      <Path d="M11 21C11 17.5 8 15 8 15" />
    </Svg>
  );
}
