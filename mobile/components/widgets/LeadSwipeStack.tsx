import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';
import { haptic } from '../../lib/haptics';
import { Avatar } from '../ui/Avatar';
import { ScoreBadge } from '../ui/ScoreBadge';
import { Chip } from '../ui/Chip';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_H_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_V_THRESHOLD = 120;
const VELOCITY_THRESHOLD = 800;
const CARD_HEIGHT = 300;

type Lead = {
  id: string;
  name: string;
  headline?: string;
  company?: string;
  score?: number;
  icp?: string;
  avatar?: string;
  postPreview?: string;
};

type SwipeDir = 'left' | 'right' | 'up';

type CardProps = {
  lead: Lead;
  isTop: boolean;
  stackIndex: number;
  onSwipe: (id: string, dir: SwipeDir) => void;
};

function SwipeCard({ lead, isTop, stackIndex, onSwipe }: CardProps) {
  const { palette, radius } = useTheme();
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const hapticFired = useSharedValue(0);

  const fireLight = useCallback(() => haptic.light(), []);
  const fireMedium = useCallback(() => haptic.medium(), []);
  const commitSwipe = useCallback((dir: SwipeDir) => {
    haptic.medium();
    onSwipe(lead.id, dir);
  }, [lead.id, onSwipe]);

  const pan = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
      const overH =
        Math.abs(e.translationX) > SWIPE_H_THRESHOLD ||
        Math.abs(e.velocityX) > VELOCITY_THRESHOLD;
      if (overH && hapticFired.value === 0) {
        hapticFired.value = 1;
        runOnJS(fireLight)();
      } else if (!overH) {
        hapticFired.value = 0;
      }
    })
    .onEnd((e) => {
      hapticFired.value = 0;
      const vx = e.velocityX;
      if (e.translationX > SWIPE_H_THRESHOLD || vx > VELOCITY_THRESHOLD) {
        tx.value = withSpring(SCREEN_WIDTH * 1.5, { velocity: vx });
        runOnJS(commitSwipe)('right');
      } else if (e.translationX < -SWIPE_H_THRESHOLD || vx < -VELOCITY_THRESHOLD) {
        tx.value = withSpring(-SCREEN_WIDTH * 1.5, { velocity: vx });
        runOnJS(commitSwipe)('left');
      } else if (e.translationY < -SWIPE_V_THRESHOLD) {
        ty.value = withSpring(-SCREEN_WIDTH, {});
        runOnJS(commitSwipe)('up');
      } else {
        tx.value = withSpring(0, { damping: 14, stiffness: 180 });
        ty.value = withSpring(0, { damping: 14, stiffness: 180 });
      }
    });

  const cardAnim = useAnimatedStyle(() => {
    if (!isTop) {
      return {
        transform: [
          { scale: 1 - stackIndex * 0.04 },
          { translateY: stackIndex * 10 },
        ],
      };
    }
    const rotate = interpolate(tx.value, [-SCREEN_WIDTH, SCREEN_WIDTH], [-28, 28], Extrapolation.CLAMP);
    return {
      transform: [
        { translateX: tx.value },
        { translateY: ty.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const saveAnim = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [0, SWIPE_H_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));
  const skipAnim = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [-SWIPE_H_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));
  const contactAnim = useAnimatedStyle(() => ({
    opacity: interpolate(ty.value, [-SWIPE_V_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          styles.card,
          { borderRadius: radius, backgroundColor: palette.card, borderColor: palette.border },
          cardAnim,
        ]}
      >
        {/* Action overlays */}
        <Animated.View style={[styles.overlay, { borderRadius: radius, backgroundColor: palette.success + '38' }, saveAnim]}>
          <Text style={[styles.overlayLabel, { color: palette.success }]}>SAVE</Text>
        </Animated.View>
        <Animated.View style={[styles.overlay, { borderRadius: radius, backgroundColor: palette.destructive + '38' }, skipAnim]}>
          <Text style={[styles.overlayLabel, { color: palette.destructive, right: 20, left: undefined }]}>SKIP</Text>
        </Animated.View>
        <Animated.View style={[styles.overlay, { borderRadius: radius, backgroundColor: palette.primary + '38' }, contactAnim]}>
          <Text style={[styles.overlayLabel, { color: palette.primary, top: 20, left: '35%' as any }]}>CONTACT</Text>
        </Animated.View>

        {/* Header */}
        <View style={styles.cardHeader}>
          <Avatar name={lead.name} uri={lead.avatar} size={52} />
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: palette.text, fontSize: 17, fontWeight: '700', fontFamily: 'Inter_700Bold' }}
              numberOfLines={1}
            >
              {lead.name}
            </Text>
            {lead.headline ? (
              <Text
                style={{ color: palette.muted, fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 1 }}
                numberOfLines={1}
              >
                {lead.headline}
              </Text>
            ) : null}
          </View>
          {lead.score !== undefined && <ScoreBadge score={lead.score} />}
        </View>

        {/* Chips */}
        <View style={styles.chipRow}>
          {lead.company ? <Chip label={lead.company} /> : null}
          {lead.icp ? <Chip label={lead.icp} color="#8B5CF6" active /> : null}
        </View>

        {/* Post preview */}
        {lead.postPreview ? (
          <Text
            style={{
              color: palette.muted,
              fontSize: 13,
              lineHeight: 20,
              fontFamily: 'Inter_400Regular',
              flex: 1,
            }}
            numberOfLines={3}
          >
            {lead.postPreview}
          </Text>
        ) : null}

        {/* Swipe hints */}
        <View style={styles.hints}>
          <Text style={{ color: palette.destructive, fontSize: 11, opacity: 0.6 }}>← Skip</Text>
          <Text style={{ color: palette.primary, fontSize: 11, opacity: 0.6 }}>↑ Contact</Text>
          <Text style={{ color: palette.success, fontSize: 11, opacity: 0.6 }}>Save →</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

type Props = { onAction?: (action: string) => void };

export default function LeadSwipeStack({ onAction }: Props) {
  const { palette, radius } = useTheme();
  const qc = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const swipeCountRef = useRef(0);

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['leads-swipe'],
    queryFn: async () => {
      const res = await api.get<Lead[]>('/leads', { params: { status: 'New', limit: 10 } });
      return res.data;
    },
  });

  // Reset index when fresh data loads
  useEffect(() => {
    if (leads.length > 0 && currentIndex >= leads.length) {
      setCurrentIndex(0);
    }
  }, [leads.length, currentIndex]);

  // Refetch when stack runs low
  useEffect(() => {
    const remaining = leads.length - currentIndex;
    if (remaining <= 2 && swipeCountRef.current > 0) {
      qc.invalidateQueries({ queryKey: ['leads-swipe'] });
    }
  }, [currentIndex, leads.length, qc]);

  const handleSwipe = useCallback(
    async (id: string, dir: SwipeDir) => {
      swipeCountRef.current += 1;
      setCurrentIndex((prev) => prev + 1);
      onAction?.(`swipe:${dir}:${id}`);

      const statusMap: Record<SwipeDir, string> = {
        right: 'Saved',
        left: 'Skipped',
        up: 'Contacted',
      };
      try {
        await api.post(`/leads/${id}/status`, { status: statusMap[dir] });
      } catch {
        // Optimistic update; silent fail
      }
    },
    [onAction]
  );

  if (isLoading) {
    return (
      <View style={[styles.placeholder, { backgroundColor: palette.card, borderColor: palette.border, borderRadius: radius }]}>
        <ActivityIndicator color={palette.primary} />
        <Text style={{ color: palette.muted, fontSize: 13, marginTop: 10 }}>Loading leads…</Text>
      </View>
    );
  }

  const visibleLeads = leads.slice(currentIndex, currentIndex + 5);

  if (!visibleLeads.length) {
    return (
      <View style={[styles.placeholder, { backgroundColor: palette.card, borderColor: palette.border, borderRadius: radius }]}>
        <Text style={{ color: palette.text, fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold', marginBottom: 6 }}>
          All caught up
        </Text>
        <Text style={{ color: palette.muted, fontSize: 13, fontFamily: 'Inter_400Regular' }}>
          Pull home to refresh
        </Text>
      </View>
    );
  }

  const remaining = leads.length - currentIndex;

  return (
    <View style={styles.container}>
      {/* Render back-to-front so top card is on top of native z-order */}
      {[...visibleLeads].reverse().map((lead, reversedIdx) => {
        const stackIndex = visibleLeads.length - 1 - reversedIdx;
        const isTop = stackIndex === 0;
        return (
          <View
            key={lead.id}
            style={[StyleSheet.absoluteFill, { zIndex: visibleLeads.length - stackIndex }]}
          >
            <SwipeCard
              lead={lead}
              isTop={isTop}
              stackIndex={stackIndex}
              onSwipe={handleSwipe}
            />
          </View>
        );
      })}

      {remaining > 1 && (
        <View style={styles.counter}>
          <Text style={{ color: palette.muted, fontSize: 12, fontFamily: 'Inter_400Regular' }}>
            {remaining - 1} more
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: CARD_HEIGHT + 44,
    marginBottom: 8,
  },
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: CARD_HEIGHT,
    borderWidth: 0.5,
    padding: 16,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayLabel: {
    position: 'absolute',
    top: 20,
    left: 20,
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
    opacity: 0.95,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  hints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ffffff18',
  },
  placeholder: {
    borderWidth: 0.5,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  counter: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    zIndex: 0,
  },
});
