import React from 'react';
import Svg, { Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function ChartIcon({ size = 24, color = '#000000', strokeWidth = 2.25 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="4" y="12" width="4" height="8" rx="1.5" fill={color} stroke="none" />
      <Rect x="10" y="6" width="4" height="14" rx="1.5" fill={color} stroke="none" />
      <Rect x="16" y="9" width="4" height="11" rx="1.5" fill={color} stroke="none" />
    </Svg>
  );
}
