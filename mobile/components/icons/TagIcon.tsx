import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function TagIcon({ size = 24, color = '#000000', strokeWidth = 2.25 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 3L3 11L13 21C13.5 21.5 14.5 21.5 15 21L21 15C21.5 14.5 21.5 13.5 21 13L11 3H3Z" />
      <Circle cx="7.5" cy="7.5" r="1.5" fill={color} stroke="none" />
    </Svg>
  );
}
