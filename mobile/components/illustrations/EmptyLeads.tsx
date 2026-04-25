import React from 'react';
import Svg, { Rect, Ellipse, Circle, Line, Path } from 'react-native-svg';

interface Props { width?: number; height?: number }

export function EmptyLeads({ width = 320, height = 240 }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 320 240">
      <Rect width="320" height="240" fill="#FAF7F2"/>
      {/* stem */}
      <Line x1="160" y1="190" x2="160" y2="140" stroke="#2C1810" strokeWidth="2" strokeLinecap="round" opacity={0.6}/>
      {/* leaves */}
      <Path d="M160 168 Q145 158 138 148 Q152 152 160 168Z" fill="#C8553D" opacity={0.35}/>
      <Path d="M160 160 Q175 150 182 140 Q168 146 160 160Z" fill="#C8553D" opacity={0.3}/>
      {/* bud */}
      <Ellipse cx="160" cy="120" rx="12" ry="22" fill="#FF4716" opacity={0.8} stroke="#2C1810" strokeWidth="1.2"/>
      <Ellipse cx="150" cy="126" rx="10" ry="18" fill="#FFB098" opacity={0.7} stroke="#2C1810" strokeWidth={1} transform="rotate(-15, 150, 126)"/>
      <Ellipse cx="170" cy="126" rx="10" ry="18" fill="#FFB098" opacity={0.7} stroke="#2C1810" strokeWidth={1} transform="rotate(15, 170, 126)"/>
      <Ellipse cx="160" cy="103" rx="7" ry="5" fill="#C8553D" opacity={0.9} stroke="#2C1810" strokeWidth={1}/>
      {/* magnifier */}
      <Circle cx="215" cy="105" r="22" fill="none" stroke="#2C1810" strokeWidth="2" strokeLinecap="round" opacity={0.55}/>
      <Line x1="231" y1="121" x2="244" y2="134" stroke="#2C1810" strokeWidth="2.5" strokeLinecap="round" opacity={0.55}/>
      {/* ground */}
      <Line x1="100" y1="195" x2="220" y2="195" stroke="#2C1810" strokeWidth="1.2" strokeLinecap="round" opacity={0.2}/>
      <Circle cx="130" cy="198" r="2.5" fill="#C8553D" opacity={0.2}/>
      <Circle cx="185" cy="197" r="3" fill="#C8553D" opacity={0.2}/>
    </Svg>
  );
}
