import React from 'react';
import Svg, { Rect, Ellipse, Circle, G, Line, Path, Polygon } from 'react-native-svg';

interface Props { width?: number; height?: number }

export function HeroPaywall({ width = 320, height = 213 }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 480 320">
      <Rect width="480" height="320" fill="transparent"/>
      {/* growth arrow */}
      <Path d="M80 260 Q180 240 280 200 Q360 165 420 120" fill="none" stroke="#FFB098" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 4" opacity={0.6}/>
      <Polygon points="420,120 408,132 426,134" fill="#FF4716" opacity={0.5}/>
      {/* small flower left */}
      <G transform="translate(100,240)">
        <Ellipse cx="0" cy="-20" rx="9" ry="15" fill="#FFB098" opacity={0.75} stroke="#2C1810" strokeWidth={1}/>
        <Ellipse cx="0" cy="-20" rx="9" ry="15" fill="#FFB098" opacity={0.7} stroke="#2C1810" strokeWidth={1} transform="rotate(45, 0, 0)"/>
        <Ellipse cx="0" cy="-20" rx="9" ry="15" fill="#FFB098" opacity={0.75} stroke="#2C1810" strokeWidth={1} transform="rotate(90, 0, 0)"/>
        <Ellipse cx="0" cy="-20" rx="9" ry="15" fill="#FFB098" opacity={0.7} stroke="#2C1810" strokeWidth={1} transform="rotate(135, 0, 0)"/>
        <Ellipse cx="0" cy="-20" rx="9" ry="15" fill="#FFB098" opacity={0.75} stroke="#2C1810" strokeWidth={1} transform="rotate(180, 0, 0)"/>
        <Ellipse cx="0" cy="-20" rx="9" ry="15" fill="#FFB098" opacity={0.7} stroke="#2C1810" strokeWidth={1} transform="rotate(225, 0, 0)"/>
        <Ellipse cx="0" cy="-20" rx="9" ry="15" fill="#FFB098" opacity={0.75} stroke="#2C1810" strokeWidth={1} transform="rotate(270, 0, 0)"/>
        <Ellipse cx="0" cy="-20" rx="9" ry="15" fill="#FFB098" opacity={0.7} stroke="#2C1810" strokeWidth={1} transform="rotate(315, 0, 0)"/>
        <Circle cx="0" cy="0" r="7" fill="#FAF7F2" stroke="#2C1810" strokeWidth="1.2"/>
        <Circle cx="0" cy="0" r="3" fill="#FFB098"/>
      </G>
      {/* medium flower center */}
      <G transform="translate(255,195)">
        <Ellipse cx="0" cy="-28" rx="12" ry="21" fill="#C8553D" opacity={0.82} stroke="#2C1810" strokeWidth="1.2"/>
        <Ellipse cx="0" cy="-28" rx="12" ry="21" fill="#C8553D" opacity={0.78} stroke="#2C1810" strokeWidth="1.2" transform="rotate(45, 0, 0)"/>
        <Ellipse cx="0" cy="-28" rx="12" ry="21" fill="#C8553D" opacity={0.82} stroke="#2C1810" strokeWidth="1.2" transform="rotate(90, 0, 0)"/>
        <Ellipse cx="0" cy="-28" rx="12" ry="21" fill="#C8553D" opacity={0.78} stroke="#2C1810" strokeWidth="1.2" transform="rotate(135, 0, 0)"/>
        <Ellipse cx="0" cy="-28" rx="12" ry="21" fill="#C8553D" opacity={0.82} stroke="#2C1810" strokeWidth="1.2" transform="rotate(180, 0, 0)"/>
        <Ellipse cx="0" cy="-28" rx="12" ry="21" fill="#C8553D" opacity={0.78} stroke="#2C1810" strokeWidth="1.2" transform="rotate(225, 0, 0)"/>
        <Ellipse cx="0" cy="-28" rx="12" ry="21" fill="#C8553D" opacity={0.82} stroke="#2C1810" strokeWidth="1.2" transform="rotate(270, 0, 0)"/>
        <Ellipse cx="0" cy="-28" rx="12" ry="21" fill="#C8553D" opacity={0.78} stroke="#2C1810" strokeWidth="1.2" transform="rotate(315, 0, 0)"/>
        <Circle cx="0" cy="0" r="9" fill="#FAF7F2" stroke="#2C1810" strokeWidth="1.3"/>
        <Circle cx="0" cy="0" r="4" fill="#C8553D"/>
      </G>
      {/* large flower right */}
      <G transform="translate(400,130)">
        <Ellipse cx="0" cy="-38" rx="16" ry="28" fill="#FF4716" opacity={0.92} stroke="#2C1810" strokeWidth="1.5"/>
        <Ellipse cx="0" cy="-38" rx="16" ry="28" fill="#FF4716" opacity={0.88} stroke="#2C1810" strokeWidth="1.5" transform="rotate(45, 0, 0)"/>
        <Ellipse cx="0" cy="-38" rx="16" ry="28" fill="#C8553D" opacity={0.85} stroke="#2C1810" strokeWidth="1.5" transform="rotate(90, 0, 0)"/>
        <Ellipse cx="0" cy="-38" rx="16" ry="28" fill="#FF4716" opacity={0.88} stroke="#2C1810" strokeWidth="1.5" transform="rotate(135, 0, 0)"/>
        <Ellipse cx="0" cy="-38" rx="16" ry="28" fill="#C8553D" opacity={0.85} stroke="#2C1810" strokeWidth="1.5" transform="rotate(180, 0, 0)"/>
        <Ellipse cx="0" cy="-38" rx="16" ry="28" fill="#FF4716" opacity={0.88} stroke="#2C1810" strokeWidth="1.5" transform="rotate(225, 0, 0)"/>
        <Ellipse cx="0" cy="-38" rx="16" ry="28" fill="#C8553D" opacity={0.9} stroke="#2C1810" strokeWidth="1.5" transform="rotate(270, 0, 0)"/>
        <Ellipse cx="0" cy="-38" rx="16" ry="28" fill="#FF4716" opacity={0.88} stroke="#2C1810" strokeWidth="1.5" transform="rotate(315, 0, 0)"/>
        <Circle cx="0" cy="0" r="13" fill="#FAF7F2" stroke="#2C1810" strokeWidth="1.5"/>
        <Circle cx="0" cy="0" r="5" fill="#FF4716"/>
      </G>
      <Circle cx="370" cy="80" r="2.5" fill="#FF4716" opacity={0.6}/>
      <Circle cx="440" cy="95" r="2" fill="#FFB098" opacity={0.55}/>
    </Svg>
  );
}
