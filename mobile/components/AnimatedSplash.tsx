import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, AccessibilityInfo, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import Svg, { Ellipse, Circle } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const PETAL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

interface PetalProps {
  angle: number;
  delay: number;
  reduced: boolean;
}

function Petal({ angle, delay, reduced }: PetalProps) {
  const opacity = useSharedValue(reduced ? 1 : 0);
  const scale = useSharedValue(reduced ? 1 : 0);
  const rotate = useSharedValue(reduced ? angle : angle - 30);

  useEffect(() => {
    if (reduced) return;
    opacity.value = withDelay(delay, withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }));
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 14, stiffness: 90 })
    );
    rotate.value = withDelay(
      delay,
      withSpring(angle, { damping: 14, stiffness: 90 })
    );
  }, [angle, delay, reduced, opacity, scale, rotate]);

  const animatedProps = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedProps]}>
      <Svg width="100%" height="100%" viewBox="-256 -256 512 512">
        <Ellipse cx={0} cy={-141} rx={36} ry={107} fill="#0E0E0C" />
      </Svg>
    </Animated.View>
  );
}

interface Props {
  onComplete?: () => void;
}

export function AnimatedSplash({ onComplete }: Props) {
  const containerOpacity = useSharedValue(1);
  const coreScale = useSharedValue(0);
  const wordOffset = useSharedValue(12);
  const wordOpacity = useSharedValue(0);
  const captionOpacity = useSharedValue(0);
  const [reduced, setReduced] = React.useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      AccessibilityInfo.isReduceMotionEnabled?.().then(setReduced).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (reduced) {
      coreScale.value = 1;
      wordOpacity.value = 1;
      wordOffset.value = 0;
      captionOpacity.value = 1;
      const timeout = setTimeout(() => {
        containerOpacity.value = withTiming(0, { duration: 250 }, (finished) => {
          if (finished && onComplete) runOnJS(onComplete)();
        });
      }, 600);
      return () => clearTimeout(timeout);
    }

    coreScale.value = withDelay(
      450,
      withSpring(1, { damping: 8, stiffness: 180 })
    );
    wordOffset.value = withDelay(
      600,
      withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) })
    );
    wordOpacity.value = withDelay(
      600,
      withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) })
    );
    captionOpacity.value = withDelay(
      900,
      withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) })
    );

    const timeout = setTimeout(() => {
      containerOpacity.value = withTiming(0, { duration: 320, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished && onComplete) runOnJS(onComplete)();
      });
    }, 1500);
    return () => clearTimeout(timeout);
  }, [reduced]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coreScale.value }],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOpacity.value,
    transform: [{ translateY: wordOffset.value }],
  }));
  const captionStyle = useAnimatedStyle(() => ({ opacity: captionOpacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, containerStyle]}
    >
      <View style={styles.flowerHolder}>
        {PETAL_ANGLES.map((angle, i) => (
          <Petal key={angle} angle={angle} delay={80 + i * 60} reduced={reduced} />
        ))}
        <Animated.View style={[StyleSheet.absoluteFill, coreStyle, { alignItems: 'center', justifyContent: 'center' }]}>
          <Svg width="100%" height="100%" viewBox="-256 -256 512 512">
            <Circle cx={0} cy={0} r={26} fill="#FF5A1F" />
          </Svg>
        </Animated.View>
      </View>
      <Animated.Text style={[styles.wordmark, wordStyle]}>LeadHangover</Animated.Text>
      <Animated.Text style={[styles.caption, captionStyle]}>wake up to better leads</Animated.Text>
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
    backgroundColor: '#F7F1E5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  flowerHolder: {
    width: 140,
    height: 140,
    position: 'relative',
    marginBottom: 26,
  },
  wordmark: {
    fontSize: 28,
    color: '#0E0E0C',
    fontFamily: 'Fraunces_600SemiBold',
    fontStyle: 'italic',
    letterSpacing: -0.4,
  },
  caption: {
    marginTop: 8,
    fontSize: 12,
    color: '#2A2823',
    fontFamily: 'GeistMono_400Regular',
    letterSpacing: 1.2,
    textTransform: 'lowercase',
  },
});

export default AnimatedSplash;
