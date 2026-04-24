import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function AiIcon({ size = 24, color = '#000000', strokeWidth = 2.25 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2C12 2 13.5 7 12 12C10.5 7 12 2 12 2Z" />
      <Path d="M22 12C22 12 17 13.5 12 12C17 10.5 22 12 22 12Z" />
      <Path d="M12 22C12 22 10.5 17 12 12C13.5 17 12 22 12 22Z" />
      <Path d="M2 12C2 12 7 10.5 12 12C7 13.5 2 12 2 12Z" />
    </Svg>
  );
}
