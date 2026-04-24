import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function SettingsIcon({ size = 24, color = '#000000', strokeWidth = 2.25 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="3" />
      <Path d="M12 1V4.5M12 19.5V23M3.7 5.3L6.2 7.8M17.8 16.2L20.3 18.7M1 12H4.5M19.5 12H23M3.7 18.7L6.2 16.2M17.8 7.8L20.3 5.3" />
    </Svg>
  );
}
