import React from 'react';
import Svg, { Path, Line } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function LeadIcon({ size = 24, color = '#000000', strokeWidth = 2.25 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 3C14 6 16 8 16 11C16 13.5 14 15 12 15C10 15 8 13.5 8 11C8 8 10 6 12 3Z" />
      <Line x1="12" y1="15" x2="12" y2="21" />
      <Line x1="8.5" y1="19" x2="15.5" y2="19" />
    </Svg>
  );
}
