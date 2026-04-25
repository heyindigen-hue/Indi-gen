import React, { useEffect } from 'react';
import Svg, { Rect, Ellipse, Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface Props { width?: number; height?: number }

const AnimatedG = Animated.createAnimatedComponent(G as any);

export function ScrapeRunning({ width = 120, height = 120 }: Props) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Svg width={width} height={height} viewBox="0 0 120 120">
      <Rect width="120" height="120" fill="transparent"/>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width,
            height,
            alignItems: 'center',
            justifyContent: 'center',
          },
          animStyle,
        ]}
      >
        <Svg width={width} height={height} viewBox="0 0 120 120">
          <G transform="translate(60,60)">
            <Ellipse cx="0" cy="-22" rx="9" ry="15" fill="#FF4716" opacity={0.9} stroke="#2C1810" strokeWidth="1"/>
            <Ellipse cx="0" cy="-22" rx="9" ry="15" fill="#C8553D" opacity={0.85} stroke="#2C1810" strokeWidth="1" transform="rotate(45, 0, 0)"/>
            <Ellipse cx="0" cy="-22" rx="9" ry="15" fill="#FF4716" opacity={0.88} stroke="#2C1810" strokeWidth="1" transform="rotate(90, 0, 0)"/>
            <Ellipse cx="0" cy="-22" rx="9" ry="15" fill="#C8553D" opacity={0.85} stroke="#2C1810" strokeWidth="1" transform="rotate(135, 0, 0)"/>
            <Ellipse cx="0" cy="-22" rx="9" ry="15" fill="#FF4716" opacity={0.9} stroke="#2C1810" strokeWidth="1" transform="rotate(180, 0, 0)"/>
            <Ellipse cx="0" cy="-22" rx="9" ry="15" fill="#C8553D" opacity={0.85} stroke="#2C1810" strokeWidth="1" transform="rotate(225, 0, 0)"/>
            <Ellipse cx="0" cy="-22" rx="9" ry="15" fill="#FF4716" opacity={0.88} stroke="#2C1810" strokeWidth="1" transform="rotate(270, 0, 0)"/>
            <Ellipse cx="0" cy="-22" rx="9" ry="15" fill="#C8553D" opacity={0.85} stroke="#2C1810" strokeWidth="1" transform="rotate(315, 0, 0)"/>
            <Circle cx="0" cy="0" r="8" fill="#FAF7F2" stroke="#2C1810" strokeWidth="1.2"/>
            <Circle cx="0" cy="0" r="3" fill="#FF4716"/>
          </G>
        </Svg>
      </Animated.View>
    </Svg>
  );
}
