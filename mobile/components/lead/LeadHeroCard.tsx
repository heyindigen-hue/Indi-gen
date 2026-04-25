import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '../../lib/themeContext';
import { haptic } from '../../lib/haptics';
import { Avatar } from '../ui/Avatar';
import { Lead } from '../../lib/useLeads';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_X_THRESHOLD = SCREEN_W * 0.25;
const SWIPE_Y_THRESHOLD = 110;
const VELOCITY = 800;

export type SwipeAction = 'save' | 'skip' | 'detail';

type Props = {
  lead: Lead;
  onSave: () => void;
  onSkip: () => void;
  onOpenDetail: () => void;
};

function buildSubtitle(l: Lead): string {
  const parts: string[] = [];
  if (l.headline) parts.push(l.headline);
  if (l.company) parts.push(l.company);
  return parts.join(' · ');
}

function intentLabel(l: Lead): string | null {
  if (!l.intent_label) return null;
  return l.intent_label.replace(/_/g, ' ').toLowerCase();
}

const LeadHeroCardImpl = ({ lead, onSave, onSkip, onOpenDetail }: Props) => {
  const { palette, radius } = useTheme();

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const cardOpacity = useSharedValue(1);

  const photo = lead.profile_data?.profile_photo_url;
  const subtitle = buildSubtitle(lead);
  const intent = intentLabel(lead);
  const score = lead.score ?? 0;
  const scoreColor =
    score >= 8 ? palette.success : score >= 6 ? palette.warning : palette.muted;

  const exitToLeft = useCallback(() => {
    tx.value = withTiming(-SCREEN_W * 1.4, { duration: 180 });
    cardOpacity.value = withTiming(0, { duration: 180 });
  }, [tx, cardOpacity]);

  const exitToRight = useCallback(() => {
    tx.value = withTiming(SCREEN_W * 1.4, { duration: 180 });
    cardOpacity.value = withTiming(0, { duration: 180 });
  }, [tx, cardOpacity]);

  const fireSave = useCallback(() => {
    haptic.success();
    onSave();
  }, [onSave]);

  const fireSkip = useCallback(() => {
    haptic.light();
    onSkip();
  }, [onSkip]);

  const fireDetail = useCallback(() => {
    haptic.medium();
    onOpenDetail();
  }, [onOpenDetail]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
    })
    .onEnd((e) => {
      const passedRight =
        e.translationX > SWIPE_X_THRESHOLD || e.velocityX > VELOCITY;
      const passedLeft =
        e.translationX < -SWIPE_X_THRESHOLD || e.velocityX < -VELOCITY;
      const passedUp = e.translationY < -SWIPE_Y_THRESHOLD;

      if (passedRight) {
        runOnJS(exitToRight)();
        runOnJS(fireSave)();
      } else if (passedLeft) {
        runOnJS(exitToLeft)();
        runOnJS(fireSkip)();
      } else if (passedUp) {
        runOnJS(fireDetail)();
        tx.value = withSpring(0);
        ty.value = withSpring(0);
      } else {
        tx.value = withSpring(0, { damping: 14, stiffness: 180 });
        ty.value = withSpring(0, { damping: 14, stiffness: 180 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      tx.value,
      [-SCREEN_W, SCREEN_W],
      [-12, 12],
      Extrapolation.CLAMP
    );
    return {
      opacity: cardOpacity.value,
      transform: [
        { translateX: tx.value },
        { translateY: ty.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const saveBadgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [0, SWIPE_X_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));
  const skipBadgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [-SWIPE_X_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: palette.card,
            borderColor: palette.border,
            borderRadius: radius * 1.5,
            shadowColor: '#000',
          },
          cardStyle,
        ]}
      >
        {/* corner action badges */}
        <Animated.View
          style={[
            styles.cornerBadge,
            { left: 18, top: 18, borderColor: palette.success, transform: [{ rotate: '-12deg' }] },
            saveBadgeStyle,
          ]}
        >
          <Text style={[styles.cornerBadgeText, { color: palette.success }]}>SAVE</Text>
        </Animated.View>
        <Animated.View
          style={[
            styles.cornerBadge,
            { right: 18, top: 18, borderColor: palette.destructive, transform: [{ rotate: '12deg' }] },
            skipBadgeStyle,
          ]}
        >
          <Text style={[styles.cornerBadgeText, { color: palette.destructive }]}>SKIP</Text>
        </Animated.View>

        {/* score chip */}
        <View
          style={[
            styles.scoreChip,
            { backgroundColor: scoreColor + '22', borderColor: scoreColor + '55' },
          ]}
        >
          <Text style={[styles.scoreText, { color: scoreColor }]}>
            {score.toFixed(0)}
          </Text>
          <Text style={[styles.scoreLabel, { color: scoreColor }]}>match</Text>
        </View>

        {/* avatar + name */}
        <View style={{ alignItems: 'flex-start', marginTop: 8 }}>
          <Avatar uri={photo} name={lead.name} size={56} />
        </View>

        <Text
          style={[styles.name, { color: palette.text, fontFamily: 'Fraunces_600SemiBold' }]}
          numberOfLines={2}
        >
          {lead.name || 'Unknown lead'}
        </Text>
        {!!subtitle && (
          <Text
            style={[styles.subtitle, { color: palette.muted, fontFamily: 'Inter_400Regular' }]}
            numberOfLines={3}
          >
            {subtitle}
          </Text>
        )}

        {!!intent && (
          <View
            style={[
              styles.intentChip,
              { backgroundColor: palette.primary + '14', borderColor: palette.primary + '35' },
            ]}
          >
            <Text style={[styles.intentText, { color: palette.primary }]}>
              ▴ {intent}
            </Text>
          </View>
        )}

        {!!lead.post_text && (
          <Text
            style={[styles.post, { color: palette.muted }]}
            numberOfLines={3}
          >
            “{lead.post_text}”
          </Text>
        )}

        <View style={styles.cta}>
          <Pressable
            onPress={() => {
              fireSkip();
              exitToLeft();
            }}
            style={[
              styles.btn,
              {
                backgroundColor: 'transparent',
                borderColor: palette.text,
                borderWidth: 1,
              },
            ]}
            android_ripple={{ color: palette.border }}
          >
            <Text
              style={{
                color: palette.text,
                fontSize: 14,
                fontFamily: 'Inter_600SemiBold',
              }}
            >
              Skip
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              fireSave();
              exitToRight();
            }}
            style={[
              styles.btn,
              {
                backgroundColor: palette.primary,
                borderWidth: 0,
                flex: 2,
              },
            ]}
            android_ripple={{ color: '#ffffff44' }}
          >
            <Text
              style={{
                color: palette.primaryFg,
                fontSize: 14,
                fontFamily: 'Inter_600SemiBold',
                letterSpacing: 0.3,
              }}
            >
              Save lead →
            </Text>
          </Pressable>
        </View>

        <Pressable onPress={fireDetail} hitSlop={16} style={styles.detailHint}>
          <Text style={{ color: palette.muted, fontSize: 11, fontFamily: 'Inter_400Regular' }}>
            ↑ swipe up for details
          </Text>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
};

export const LeadHeroCard = React.memo(LeadHeroCardImpl, (a, b) => a.lead.id === b.lead.id);

const styles = StyleSheet.create({
  card: {
    padding: 22,
    paddingBottom: 18,
    borderWidth: 0.5,
    minHeight: 380,
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    overflow: 'hidden',
  },
  scoreChip: {
    position: 'absolute',
    top: 18,
    right: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  scoreLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    opacity: 0.85,
  },
  cornerBadge: {
    position: 'absolute',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    zIndex: 9,
  },
  cornerBadgeText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.5,
    fontFamily: 'Inter_700Bold',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 16,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  intentChip: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  intentText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    textTransform: 'capitalize',
  },
  post: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
  },
  cta: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 'auto',
    paddingTop: 18,
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHint: {
    alignItems: 'center',
    paddingTop: 8,
  },
});

export default LeadHeroCard;
