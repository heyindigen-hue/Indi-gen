import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Linking,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeftIcon,
  XIcon,
  SparkleIcon,
  SearchIcon,
  UsersIcon,
  MailIcon,
  PhoneIcon,
  LinkIcon,
  PenLineIcon,
} from '../../components/icons';

import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';
import { haptic } from '../../lib/haptics';
import { Avatar } from '../../components/ui/Avatar';
import { ScoreBadge } from '../../components/ui/ScoreBadge';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import DraftEditor from '../../components/lead/DraftEditor';
import ContactRow from '../../components/lead/ContactRow';
import TimelineAccordion from '../../components/lead/TimelineAccordion';

type Lead = {
  id: string;
  name: string;
  headline?: string;
  company?: string;
  connections?: string;
  score?: number;
  icp?: string;
  tags?: string[];
  avatar?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  postPreview?: string;
  status?: string;
  notes?: string;
  signedAt?: string;
};

function formatSignedDate(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function buildSubtitle(lead: Lead): string {
  const parts: string[] = [];
  if (lead.headline) parts.push(lead.headline);
  const companyPart = [lead.company, lead.connections ? `${lead.connections} conns` : undefined]
    .filter(Boolean)
    .join(' · ');
  if (companyPart) parts.push(companyPart);
  return parts.join(' | ');
}

// --- Sub-components ---

type SectionHeaderProps = {
  icon: React.ReactNode;
  title: string;
};

function SectionHeader({ icon, title }: SectionHeaderProps) {
  const { palette } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={{ opacity: 0.6 }}>{icon}</View>
      <Text style={[styles.sectionTitle, { color: palette.text }]}>{title}</Text>
    </View>
  );
}

type HeroProps = {
  lead: Lead;
};

function HeroSection({ lead }: HeroProps) {
  const { palette, radius } = useTheme();
  const subtitle = buildSubtitle(lead);

  return (
    <View style={styles.hero}>
      <Avatar uri={lead.avatar} name={lead.name} size={72} />
      <Text style={[styles.heroName, { color: palette.text }]}>{lead.name}</Text>
      {subtitle ? (
        <Text style={[styles.heroSubtitle, { color: palette.muted }]} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
      <View style={styles.chipRow}>
        {lead.score !== undefined ? <ScoreBadge score={lead.score} /> : null}
        {lead.icp ? <Chip label={lead.icp} active /> : null}
        {lead.tags?.map((tag) => (
          <Chip key={tag} label={tag} />
        ))}
      </View>
    </View>
  );
}

type QuickStatsProps = {
  lead: Lead;
};

function QuickStatsRow({ lead }: QuickStatsProps) {
  const { palette, radius } = useTheme();

  const stats: { label: string; color?: string }[] = [];
  if (lead.signedAt) {
    stats.push({ label: `Signed ${formatSignedDate(lead.signedAt)}`, color: palette.success });
  }
  if (lead.status) {
    stats.push({ label: `Status: ${lead.status}` });
  }
  if (lead.score !== undefined) {
    stats.push({ label: `Score: ${lead.score}/10` });
  }
  if (lead.connections) {
    stats.push({ label: `${lead.connections} connections` });
  }

  if (stats.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.statsRow}
    >
      {stats.map((stat, idx) => (
        <View
          key={idx}
          style={[
            styles.statChip,
            {
              backgroundColor: (stat.color ?? palette.primary) + '18',
              borderColor: (stat.color ?? palette.primary) + '40',
              borderRadius: radius / 2,
            },
          ]}
        >
          <Text
            style={[
              styles.statText,
              { color: stat.color ?? palette.primary },
            ]}
          >
            {stat.label}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

type PostSectionProps = {
  postPreview: string;
};

function RecentPostSection({ postPreview }: PostSectionProps) {
  const { palette, radius } = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.section}>
      <SectionHeader
        icon={<SearchIcon size={16} color={palette.muted} />}
        title="Recent Post"
      />
      <View
        style={[
          styles.postCard,
          { backgroundColor: palette.card, borderColor: palette.border, borderRadius: radius },
        ]}
      >
        <Text
          style={[styles.postText, { color: palette.text }]}
          numberOfLines={expanded ? undefined : 3}
        >
          {postPreview}
        </Text>
        <Pressable
          onPress={() => {
            haptic.light();
            setExpanded((prev) => !prev);
          }}
          style={styles.readMoreBtn}
        >
          <Text style={[styles.readMoreText, { color: palette.primary }]}>
            {expanded ? 'Show less ↑' : 'Read more ↓'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

type ContactsSectionProps = {
  lead: Lead;
};

function ContactsSection({ lead }: ContactsSectionProps) {
  const { palette } = useTheme();
  const hasAny = lead.email || lead.phone || lead.linkedinUrl;
  if (!hasAny) return null;

  return (
    <View style={styles.section}>
      <SectionHeader
        icon={<UsersIcon size={16} color={palette.muted} />}
        title="Contacts"
      />
      <View style={styles.contactList}>
        {lead.email ? (
          <ContactRow
            icon={<MailIcon size={18} color={palette.muted} />}
            label="Email"
            value={lead.email}
            onPress={() => Linking.openURL(`mailto:${lead.email}`)}
            onLongPress={() => {}}
          />
        ) : null}
        {lead.phone ? (
          <ContactRow
            icon={<PhoneIcon size={18} color={palette.muted} />}
            label="Phone"
            value={lead.phone}
            onPress={() => Linking.openURL(`tel:${lead.phone}`)}
            onLongPress={() => {}}
          />
        ) : null}
        {lead.linkedinUrl ? (
          <ContactRow
            icon={<LinkIcon size={18} color={palette.muted} />}
            label="LinkedIn"
            value="View Profile"
            onPress={() => Linking.openURL(lead.linkedinUrl!)}
            onLongPress={() => {}}
          />
        ) : null}
      </View>
    </View>
  );
}

type NotesSectionProps = {
  leadId: string;
  initialNotes: string;
};

function NotesSection({ leadId, initialNotes }: NotesSectionProps) {
  const { palette, radius } = useTheme();
  const [notes, setNotes] = useState(initialNotes);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notesMutation = useMutation({
    mutationFn: (text: string) =>
      api.post(`/leads/${leadId}/feedback`, { notes: text }),
  });

  const handleChangeText = useCallback(
    (text: string) => {
      setNotes(text);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        notesMutation.mutate(text);
      }, 1500);
    },
    [leadId]
  );

  return (
    <View style={styles.section}>
      <SectionHeader
        icon={<PenLineIcon size={16} color={palette.muted} />}
        title="Notes"
      />
      <TextInput
        value={notes}
        onChangeText={handleChangeText}
        multiline
        placeholder="Add notes about this lead..."
        placeholderTextColor={palette.muted}
        style={[
          styles.notesInput,
          {
            color: palette.text,
            backgroundColor: palette.card,
            borderColor: palette.border,
            borderRadius: radius,
          },
        ]}
        textAlignVertical="top"
      />
    </View>
  );
}

// --- Sticky Header ---

type StickyHeaderProps = {
  title: string;
  topInset: number;
};

function StickyHeader({ title, topInset }: StickyHeaderProps) {
  const { palette } = useTheme();
  return (
    <BlurView
      intensity={80}
      tint="dark"
      style={[styles.header, { paddingTop: topInset + 8 }]}
    >
      <Pressable
        onPress={() => {
          haptic.light();
          router.back();
        }}
        style={styles.headerBtn}
        hitSlop={8}
      >
        <ChevronLeftIcon size={22} color={palette.text} />
      </Pressable>
      <Text style={[styles.headerTitle, { color: palette.text }]} numberOfLines={1}>
        {title}
      </Text>
      <Pressable
        onPress={() => {
          haptic.light();
          router.back();
        }}
        style={styles.headerBtn}
        hitSlop={8}
      >
        <XIcon size={20} color={palette.muted} />
      </Pressable>
    </BlurView>
  );
}

// --- Sticky Bottom Bar ---

type BottomBarProps = {
  leadId: string;
  bottomInset: number;
};

function StickyBottomBar({ leadId, bottomInset }: BottomBarProps) {
  const { palette, radius } = useTheme();
  const [skipLoading, setSkipLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);

  const handleSkip = async () => {
    setSkipLoading(true);
    try {
      await api.post(`/leads/${leadId}/status`, { status: 'skipped' });
      haptic.light();
      router.back();
    } finally {
      setSkipLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      await api.post(`/leads/${leadId}/status`, { status: 'saved' });
      haptic.success();
      router.back();
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSend = async () => {
    setSendLoading(true);
    try {
      await api.post(`/leads/${leadId}/outreach`, { channel: 'whatsapp' });
      haptic.success();
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <BlurView
      intensity={80}
      tint="dark"
      style={[styles.bottomBar, { paddingBottom: bottomInset + 8 }]}
    >
      <View style={styles.bottomBarInner}>
        <Button
          label="Skip"
          onPress={handleSkip}
          variant="ghost"
          loading={skipLoading}
          style={styles.skipBtn}
        />
        <Button
          label="Save"
          onPress={handleSave}
          variant="secondary"
          loading={saveLoading}
          style={styles.saveBtn}
        />
        <Button
          label="SEND →"
          onPress={handleSend}
          variant="primary"
          loading={sendLoading}
          style={styles.sendBtn}
        />
      </View>
    </BlurView>
  );
}

// --- Main Screen ---

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: lead, isLoading } = useQuery<Lead>({
    queryKey: ['lead', id],
    queryFn: () => api.get(`/leads/${id}`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });

  const headerHeight = insets.top + 56;
  const bottomBarHeight = insets.bottom + 72;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['lead', id] });
    setRefreshing(false);
  }, [queryClient, id]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: palette.bg }]}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  if (!lead) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: palette.bg }]}>
        <Text style={[styles.errorText, { color: palette.muted }]}>Lead not found.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: palette.bg }]}>
      <StickyHeader title={lead.name || 'Lead Detail'} topInset={insets.top} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + 16, paddingBottom: bottomBarHeight + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.primary}
            progressViewOffset={headerHeight}
          />
        }
      >
        <HeroSection lead={lead} />

        <QuickStatsRow lead={lead} />

        {/* AI Drafts */}
        <View style={styles.section}>
          <SectionHeader
            icon={<SparkleIcon size={16} color={palette.muted} />}
            title="AI Drafts"
          />
          <DraftEditor
            leadId={id!}
            phone={lead.phone}
            email={lead.email}
            linkedinUrl={lead.linkedinUrl}
          />
        </View>

        {lead.postPreview ? (
          <RecentPostSection postPreview={lead.postPreview} />
        ) : null}

        <ContactsSection lead={lead} />

        {/* Timeline */}
        <View style={styles.section}>
          <TimelineAccordion leadId={id!} />
        </View>

        <NotesSection leadId={id!} initialNotes={lead.notes ?? ''} />
      </ScrollView>

      <StickyBottomBar leadId={id!} bottomInset={insets.bottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 15,
  },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 16,
    gap: 20,
  },

  // Hero
  hero: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },

  // Quick stats
  statsRow: {
    paddingHorizontal: 0,
    gap: 8,
  },
  statChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Section
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // Post
  postCard: {
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  postText: {
    fontSize: 14,
    lineHeight: 20,
  },
  readMoreBtn: {
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Contacts
  contactList: {
    gap: 8,
  },

  // Notes
  notesInput: {
    minHeight: 80,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: 12,
  },
  bottomBarInner: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 10,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 10,
  },
  sendBtn: {
    flex: 2,
    paddingVertical: 10,
  },
});
