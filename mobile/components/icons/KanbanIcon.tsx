import React from 'react';
import Svg, { Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function KanbanIcon({ size = 24, color = '#000000', strokeWidth = 2 }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect x="3" y="4" width="5" height="16" rx="1.2" />
      <Rect x="9.5" y="4" width="5" height="11" rx="1.2" />
      <Rect x="16" y="4" width="5" height="7" rx="1.2" />
    </Svg>
  );
}
