import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function BellIcon({ size = 24, color = '#000000', strokeWidth = 2.25 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" />
      <Path d="M13.73 21C13.55 21.3 13.3 21.55 12.98 21.72C12.66 21.89 12.33 21.97 12 21.97C11.67 21.97 11.34 21.89 11.02 21.72C10.7 21.55 10.45 21.3 10.27 21" />
    </Svg>
  );
}
