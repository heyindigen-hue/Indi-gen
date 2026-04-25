import React from 'react';
import Svg, { Rect, Ellipse, Circle, Path } from 'react-native-svg';

interface Props { width?: number; height?: number }

export function PaywallTokens({ width = 240, height = 240 }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 320 320">
      <Rect width="320" height="320" fill="transparent"/>
      {/* bowl made of petal curves */}
      <Path d="M100 210 Q90 180 95 150 Q100 120 120 110 Q140 100 160 105 Q180 100 200 110 Q220 120 225 150 Q230 180 220 210 Q200 240 160 250 Q120 240 100 210Z" fill="#FFE6D7" stroke="#2C1810" strokeWidth="1.8" strokeLinecap="round"/>
      {/* falling petals (tokens) */}
      <Ellipse cx="130" cy="80" rx="14" ry="20" fill="#FF4716" opacity={0.85} stroke="#2C1810" strokeWidth="1.2" transform="rotate(-30, 130, 80)"/>
      <Ellipse cx="160" cy="70" rx="14" ry="20" fill="#C8553D" opacity={0.8} stroke="#2C1810" strokeWidth="1.2"/>
      <Ellipse cx="190" cy="80" rx="14" ry="20" fill="#FF4716" opacity={0.85} stroke="#2C1810" strokeWidth="1.2" transform="rotate(30, 190, 80)"/>
      {/* collected tokens in bowl */}
      <Circle cx="148" cy="175" r="8" fill="#FF4716" opacity={0.7}/>
      <Circle cx="165" cy="188" r="6" fill="#C8553D" opacity={0.65}/>
      <Circle cx="178" cy="168" r="7" fill="#FF4716" opacity={0.6}/>
      <Circle cx="155" cy="155" r="5" fill="#FFB098" opacity={0.8}/>
      <Circle cx="172" cy="148" r="4" fill="#FF4716" opacity={0.5}/>
    </Svg>
  );
}
