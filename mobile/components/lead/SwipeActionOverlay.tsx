import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/themeContext';

type SwipeActionOverlayProps = {
  saveProgress: number;
  skipProgress: number;
  contactProgress: number;
};

export default function SwipeActionOverlay({
  saveProgress,
  skipProgress,
  contactProgress,
}: SwipeActionOverlayProps) {
  const { palette, radius } = useTheme();

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.container]} pointerEvents="none">
      {/* Right swipe — SAVE (green, left edge) */}
      {saveProgress > 0 && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            styles.gradientLeft,
            { borderRadius: radius, opacity: saveProgress },
          ]}
        >
          <View
            style={[
              styles.gradientOverlay,
              { backgroundColor: palette.success + '40', borderRadius: radius },
            ]}
          />
          <Text style={[styles.label, { color: palette.success, left: 20, top: 20 }]}>
            SAVE
          </Text>
        </View>
      )}

      {/* Left swipe — SKIP (red, right edge) */}
      {skipProgress > 0 && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            styles.gradientRight,
            { borderRadius: radius, opacity: skipProgress },
          ]}
        >
          <View
            style={[
              styles.gradientOverlay,
              { backgroundColor: palette.destructive + '40', borderRadius: radius },
            ]}
          />
          <Text style={[styles.label, { color: palette.destructive, right: 20, top: 20 }]}>
            SKIP
          </Text>
        </View>
      )}

      {/* Up swipe — CONTACT (blue, bottom) */}
      {contactProgress > 0 && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: radius, opacity: contactProgress },
          ]}
        >
          <View
            style={[
              styles.gradientOverlay,
              { backgroundColor: palette.primary + '40', borderRadius: radius },
            ]}
          />
          <Text
            style={[
              styles.label,
              {
                color: palette.primary,
                bottom: 20,
                top: undefined,
                alignSelf: 'center',
                left: undefined,
              },
            ]}
          >
            CONTACT
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
  },
  gradientLeft: {
    // content flows from left
  },
  gradientRight: {
    // content flows from right
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  label: {
    position: 'absolute',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
