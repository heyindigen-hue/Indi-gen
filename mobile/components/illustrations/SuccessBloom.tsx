import React from 'react';
import Svg, { Rect, Ellipse, Circle, G } from 'react-native-svg';

interface Props { width?: number; height?: number }

export function SuccessBloom({ width = 160, height = 160 }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 200">
      <Rect width="200" height="200" fill="transparent"/>
      <G transform="translate(100,100)">
        <Ellipse cx="0" cy="-32" rx="14" ry="24" fill="#FF4716" opacity={0.92} stroke="#2C1810" strokeWidth="1.2"/>
        <Ellipse cx="0" cy="-32" rx="14" ry="24" fill="#FF4716" opacity={0.88} stroke="#2C1810" strokeWidth="1.2" transform="rotate(45, 0, 0)"/>
        <Ellipse cx="0" cy="-32" rx="14" ry="24" fill="#C8553D" opacity={0.85} stroke="#2C1810" strokeWidth="1.2" transform="rotate(90, 0, 0)"/>
        <Ellipse cx="0" cy="-32" rx="14" ry="24" fill="#FF4716" opacity={0.88} stroke="#2C1810" strokeWidth="1.2" transform="rotate(135, 0, 0)"/>
        <Ellipse cx="0" cy="-32" rx="14" ry="24" fill="#C8553D" opacity={0.85} stroke="#2C1810" strokeWidth="1.2" transform="rotate(180, 0, 0)"/>
        <Ellipse cx="0" cy="-32" rx="14" ry="24" fill="#FF4716" opacity={0.88} stroke="#2C1810" strokeWidth="1.2" transform="rotate(225, 0, 0)"/>
        <Ellipse cx="0" cy="-32" rx="14" ry="24" fill="#C8553D" opacity={0.9} stroke="#2C1810" strokeWidth="1.2" transform="rotate(270, 0, 0)"/>
        <Ellipse cx="0" cy="-32" rx="14" ry="24" fill="#FF4716" opacity={0.88} stroke="#2C1810" strokeWidth="1.2" transform="rotate(315, 0, 0)"/>
        <Circle cx="0" cy="0" r="12" fill="#FAF7F2" stroke="#2C1810" strokeWidth="1.5"/>
        <Circle cx="0" cy="0" r="5" fill="#FF4716"/>
      </G>
      <Circle cx="46" cy="46" r="3" fill="#FF4716" opacity={0.7}/>
      <Circle cx="155" cy="48" r="2.5" fill="#C8553D" opacity={0.65}/>
      <Circle cx="42" cy="158" r="2" fill="#FF4716" opacity={0.6}/>
      <Circle cx="158" cy="155" r="3" fill="#FFB098" opacity={0.7}/>
      <Circle cx="30" cy="100" r="2" fill="#FF4716" opacity={0.5}/>
      <Circle cx="170" cy="100" r="2.5" fill="#C8553D" opacity={0.55}/>
    </Svg>
  );
}
