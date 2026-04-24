import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function PhoneIcon({ size = 24, color = '#000000', strokeWidth = 2.25 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6.6 10.8C7.8 13.2 9.8 15.2 12.2 16.4L14 14.6C14.2 14.4 14.6 14.3 14.9 14.5C15.9 14.8 16.9 15 18 15C18.6 15 19 15.4 19 16V19C19 19.6 18.6 20 18 20C10.3 20 4 13.7 4 6C4 5.4 4.4 5 5 5H8C8.6 5 9 5.4 9 6C9 7.1 9.2 8.1 9.5 9.1C9.6 9.4 9.5 9.8 9.3 10L7.5 11.8C7.3 12 7 12.1 6.8 12C6.7 11.6 6.6 11.2 6.6 10.8Z" />
    </Svg>
  );
}
