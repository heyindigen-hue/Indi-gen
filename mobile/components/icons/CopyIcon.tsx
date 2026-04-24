import React from 'react';
import Svg, { Rect, Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function CopyIcon({ size = 24, color = '#000000', strokeWidth = 2.25 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="9" y="9" width="11" height="11" rx="2" />
      <Path d="M5 15H4Q3 15 3 14V4Q3 3 4 3H14Q15 3 15 4V5" />
    </Svg>
  );
}
