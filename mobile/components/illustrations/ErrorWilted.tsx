import React from 'react';
import Svg, { Rect, Ellipse, Circle, Line, G } from 'react-native-svg';

interface Props { width?: number; height?: number }

export function ErrorWilted({ width = 160, height = 160 }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 200">
      <Rect width="200" height="200" fill="transparent"/>
      <Line x1="100" y1="175" x2="100" y2="130" stroke="#2C1810" strokeWidth="2" strokeLinecap="round" opacity={0.5}/>
      <G transform="translate(100,110)">
        <Ellipse cx="0" cy="-26" rx="13" ry="22" fill="#FFB098" opacity={0.7} stroke="#2C1810" strokeWidth="1.2" transform="rotate(-25, 0, 0)"/>
        <Ellipse cx="0" cy="-26" rx="13" ry="22" fill="#FFB098" opacity={0.65} stroke="#2C1810" strokeWidth="1.2" transform="rotate(25, 0, 0)"/>
        <Ellipse cx="0" cy="-26" rx="12" ry="20" fill="#FFB098" opacity={0.6} stroke="#2C1810" strokeWidth={1} transform="rotate(80, 0, 0)"/>
        <Ellipse cx="0" cy="-26" rx="12" ry="20" fill="#FFB098" opacity={0.6} stroke="#2C1810" strokeWidth={1} transform="rotate(-80, 0, 0)"/>
        <Ellipse cx="0" cy="-20" rx="10" ry="18" fill="#C8553D" opacity={0.5} stroke="#2C1810" strokeWidth={1} transform="rotate(150, 0, 0)"/>
        <Ellipse cx="0" cy="-20" rx="10" ry="18" fill="#C8553D" opacity={0.5} stroke="#2C1810" strokeWidth={1} transform="rotate(-150, 0, 0)"/>
        <Circle cx="0" cy="0" r="11" fill="#FAF7F2" stroke="#2C1810" strokeWidth="1.5"/>
        <Circle cx="0" cy="0" r="4" fill="#FFB098"/>
      </G>
    </Svg>
  );
}
