import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const PETALS = [0, 45, 90, 135, 180, 225, 270, 315];
const PETAL_PATH = 'M12 12C10.5 10 10.5 7 12 5.5C13.5 7 13.5 10 12 12';

interface PetalProps {
  angle: number;
  delay: number;
}

function Petal({ angle, delay }: PetalProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 200, easing: Easing.out(Easing.back(1.2)) }));
    scale.value = withDelay(delay, withTiming(1, { duration: 200, easing: Easing.out(Easing.back(1.2)) }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        { alignItems: 'center', justifyContent: 'center' },
        animStyle,
      ]}
    >
      <Svg width={72} height={72} viewBox="0 0 24 24" fill="none">
        <Path
          d={PETAL_PATH}
          stroke="#FF4716"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          transform={`rotate(${angle} 12 12)`}
        />
      </Svg>
    </Animated.View>
  );
}

interface Props {
  onComplete?: () => void;
}

export function AnimatedSplash({ onComplete }: Props) {
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    const timeout = setTimeout(() => {
      containerOpacity.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) }, (finished) => {
        if (finished && onComplete) runOnJS(onComplete)();
      });
    }, 1800);
    return () => clearTimeout(timeout);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.flowerContainer}>
        {PETALS.map((angle, i) => (
          <Petal key={angle} angle={angle} delay={i * 50} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width,
    height,
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  flowerContainer: {
    width: 72,
    height: 72,
    position: 'relative',
  },
});
