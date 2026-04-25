import React from 'react';
import Svg, { Rect, Ellipse, Circle, G, Line, Path } from 'react-native-svg';

interface Props { width?: number; height?: number }

export function HeroOnboarding({ width = 320, height = 240 }: Props) {
  const sx = width / 480;
  const sy = height / 360;
  return (
    <Svg width={width} height={height} viewBox="0 0 480 360">
      <Rect width="480" height="360" fill="#FAF7F2"/>
      {/* scattered background petals */}
      <Ellipse cx="60" cy="80" rx="14" ry="7" fill="none" stroke="#FFB098" strokeWidth="1.5" strokeLinecap="round" transform="rotate(-30, 60, 80)" opacity="0.6"/>
      <Ellipse cx="420" cy="60" rx="12" ry="6" fill="none" stroke="#FFB098" strokeWidth="1.5" strokeLinecap="round" transform="rotate(45, 420, 60)" opacity="0.5"/>
      <Ellipse cx="430" cy="290" rx="16" ry="8" fill="none" stroke="#FFB098" strokeWidth="1.5" strokeLinecap="round" transform="rotate(-20, 430, 290)" opacity="0.55"/>
      {/* center flower */}
      <G transform="translate(240,175)">
        <Ellipse cx="0" cy="-42" rx="18" ry="30" fill="#FF4716" opacity="0.92" stroke="#2C1810" strokeWidth="1.2"/>
        <Ellipse cx="0" cy="-42" rx="18" ry="30" fill="#FF4716" opacity="0.88" stroke="#2C1810" strokeWidth="1.2" transform="rotate(45, 0, 0)"/>
        <Ellipse cx="0" cy="-42" rx="18" ry="30" fill="#C8553D" opacity="0.85" stroke="#2C1810" strokeWidth="1.2" transform="rotate(90, 0, 0)"/>
        <Ellipse cx="0" cy="-42" rx="18" ry="30" fill="#FF4716" opacity="0.88" stroke="#2C1810" strokeWidth="1.2" transform="rotate(135, 0, 0)"/>
        <Ellipse cx="0" cy="-42" rx="18" ry="30" fill="#C8553D" opacity="0.85" stroke="#2C1810" strokeWidth="1.2" transform="rotate(180, 0, 0)"/>
        <Ellipse cx="0" cy="-42" rx="18" ry="30" fill="#FF4716" opacity="0.88" stroke="#2C1810" strokeWidth="1.2" transform="rotate(225, 0, 0)"/>
        <Ellipse cx="0" cy="-42" rx="18" ry="30" fill="#C8553D" opacity="0.9" stroke="#2C1810" strokeWidth="1.2" transform="rotate(270, 0, 0)"/>
        <Ellipse cx="0" cy="-42" rx="18" ry="30" fill="#FF4716" opacity="0.88" stroke="#2C1810" strokeWidth="1.2" transform="rotate(315, 0, 0)"/>
        <Circle cx="0" cy="0" r="14" fill="#FAF7F2" stroke="#2C1810" strokeWidth="1.5"/>
        <Circle cx="0" cy="0" r="6" fill="#FF4716"/>
      </G>
      {/* magnifier */}
      <Circle cx="310" cy="130" r="28" fill="none" stroke="#2C1810" strokeWidth="2.2" strokeLinecap="round" opacity="0.5"/>
      <Line x1="330" y1="152" x2="348" y2="170" stroke="#2C1810" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
      {/* sparkles */}
      <Circle cx="178" cy="120" r="3" fill="#FF4716" opacity="0.5"/>
      <Circle cx="305" cy="235" r="2.5" fill="#FF4716" opacity="0.45"/>
      <Circle cx="340" cy="110" r="2" fill="#FF4716" opacity="0.5"/>
    </Svg>
  );
}
