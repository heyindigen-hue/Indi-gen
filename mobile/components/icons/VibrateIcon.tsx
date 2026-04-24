import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function VibrateIcon({ size = 24, color = '#000000', strokeWidth = 2.25 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 2H18Q19 2 19 3V21Q19 22 18 22H6Q5 22 5 21V3Q5 2 6 2Z" />
      <Path d="M1 10V14M23 10V14M3 7V17M21 7V17" />
    </Svg>
  );
}
