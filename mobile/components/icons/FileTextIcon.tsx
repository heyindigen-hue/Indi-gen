import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function FileTextIcon({ size = 24, color = '#000000', strokeWidth = 2.25 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14 2H6Q5 2 4 3V21Q4 22 5 22H19Q20 22 20 21V8L14 2Z" />
      <Path d="M14 2V8H20M8 13H16M8 17H16M8 9H10" />
    </Svg>
  );
}
