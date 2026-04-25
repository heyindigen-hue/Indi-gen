import React from 'react';
import Svg, { Rect, Ellipse, Circle, Line, Path } from 'react-native-svg';

interface Props { width?: number; height?: number }

export function EmptyOutreach({ width = 240, height = 180 }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 320 240">
      <Rect width="320" height="240" fill="transparent"/>
      <Ellipse cx="160" cy="120" rx="40" ry="65" fill="#FFE6D7" opacity={0.5} stroke="#FF4716" strokeWidth="1.8" strokeLinecap="round" transform="rotate(-20, 160, 120)"/>
      <Ellipse cx="160" cy="120" rx="40" ry="65" fill="none" stroke="#FFB098" strokeWidth="1.2" strokeLinecap="round" transform="rotate(20, 160, 120)" opacity={0.6}/>
      <Path d="M220 110 Q245 95 255 75 Q248 90 240 105 Z" fill="#FF4716" opacity={0.4} stroke="#2C1810" strokeWidth={1} strokeLinecap="round"/>
      <Line x1="220" y1="110" x2="255" y2="75" stroke="#2C1810" strokeWidth="1.5" strokeLinecap="round" opacity={0.4}/>
      <Rect x="240" y="58" width="36" height="26" rx="4" fill="none" stroke="#2C1810" strokeWidth="1.5" opacity={0.4}/>
      <Line x1="247" y1="67" x2="269" y2="67" stroke="#2C1810" strokeWidth={1} strokeLinecap="round" opacity={0.35}/>
      <Line x1="247" y1="73" x2="263" y2="73" stroke="#2C1810" strokeWidth={1} strokeLinecap="round" opacity={0.3}/>
      <Circle cx="100" cy="90" r="3" fill="#FF4716" opacity={0.4}/>
      <Circle cx="80" cy="140" r="2" fill="#C8553D" opacity={0.35}/>
    </Svg>
  );
}
