import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { useTheme } from '../../lib/themeContext';
import { LinkIcon } from '../icons';

type ExperienceItem = {
  title?: string;
  company?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  current?: boolean;
};

type EducationItem = {
  school?: string;
  university?: string;
  degree?: string;
  field?: string;
  start_year?: number;
  end_year?: number;
};

type SkillItem = string | { name?: string };

type Social = {
  twitter?: string;
  github?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  website?: string;
  [k: string]: string | undefined;
};

export type ProfileData = {
  bio?: string;
  summary?: string;
  city?: string;
  country?: string;
  experience?: ExperienceItem[];
  education?: EducationItem[];
  skills?: SkillItem[];
  languages?: Array<string | { name?: string }>;
  social?: Social;
  [k: string]: any;
};

type Props = {
  profile: ProfileData;
};

function skillName(s: SkillItem): string {
  if (typeof s === 'string') return s;
  return s?.name ?? '';
}

function langName(l: string | { name?: string }): string {
  if (typeof l === 'string') return l;
  return l?.name ?? '';
}

function buildStarters(profile: ProfileData): string[] {
  const out: string[] = [];
  const skills = (profile.skills ?? []).map(skillName).filter(Boolean);
  if (skills[0]) out.push(skills[0]);
  const exp = (profile.experience ?? [])[0];
  if (exp?.title) {
    const role = exp.company ? `${exp.title} @ ${exp.company}` : exp.title;
    out.push(role);
  }
  const edu = (profile.education ?? [])[0];
  if (edu?.school || edu?.university) {
    out.push(String(edu.school ?? edu.university));
  }
  return out.slice(0, 3);
}

export function ProfileInsights({ profile }: Props) {
  const { palette, radius } = useTheme();

  const bio = profile.summary || profile.bio;
  const starters = useMemo(() => buildStarters(profile), [profile]);
  const skills = useMemo(
    () => (profile.skills ?? []).map(skillName).filter(Boolean).slice(0, 8),
    [profile.skills]
  );
  const experience = useMemo(() => (profile.experience ?? []).slice(0, 4), [profile.experience]);
  const currentRole = experience[0];
  const pastRoles = experience.slice(1);
  const education = profile.education ?? [];
  const languages = useMemo(
    () => (profile.languages ?? []).map(langName).filter(Boolean),
    [profile.languages]
  );

  const socialEntries: Array<{ label: string; url: string }> = [];
  const social = profile.social || {};
  for (const [key, val] of Object.entries(social)) {
    if (!val) continue;
    socialEntries.push({ label: key, url: String(val) });
  }

  const hasContent =
    bio ||
    starters.length ||
    currentRole ||
    pastRoles.length ||
    skills.length ||
    education.length ||
    languages.length ||
    socialEntries.length;

  if (!hasContent) return null;

  return (
    <View style={styles.wrap}>
      {bio ? (
        <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border, borderRadius: radius }]}>
          <Text style={[styles.label, { color: palette.muted }]}>BIO</Text>
          <Text
            style={{
              color: palette.text,
              fontSize: 16,
              lineHeight: 24,
              fontFamily: 'Fraunces_400Regular',
              fontStyle: 'italic',
              marginTop: 6,
            }}
          >
            {bio}
          </Text>
        </View>
      ) : null}

      {starters.length ? (
        <View style={styles.outerSection}>
          <Text style={[styles.label, { color: palette.muted }]}>CONVERSATION STARTERS</Text>
          <View style={styles.chipRow}>
            {starters.map((s, i) => (
              <View
                key={`${s}-${i}`}
                style={[
                  styles.chip,
                  { backgroundColor: palette.success + '18', borderColor: palette.success + '40' },
                ]}
              >
                <Text style={[styles.chipText, { color: palette.success }]} numberOfLines={1}>
                  {s}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {currentRole ? (
        <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border, borderRadius: radius }]}>
          <Text style={[styles.label, { color: palette.muted }]}>CURRENT ROLE</Text>
          <Text style={[styles.bigText, { color: palette.text }]} numberOfLines={2}>
            {[currentRole.title, currentRole.company].filter(Boolean).join(' · ')}
          </Text>
          {(currentRole.location || profile.city) ? (
            <Text style={{ color: palette.muted, fontSize: 12, marginTop: 4 }}>
              {currentRole.location ?? [profile.city, profile.country].filter(Boolean).join(', ')}
            </Text>
          ) : null}
        </View>
      ) : null}

      {pastRoles.length ? (
        <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border, borderRadius: radius }]}>
          <Text style={[styles.label, { color: palette.muted }]}>PAST POSITIONS</Text>
          {pastRoles.map((p, i) => (
            <View key={`p-${i}`} style={{ marginTop: i === 0 ? 6 : 10 }}>
              <Text style={{ color: palette.text, fontSize: 14, fontFamily: 'Inter_600SemiBold' }} numberOfLines={1}>
                {[p.title, p.company].filter(Boolean).join(' · ')}
              </Text>
              {(p.start_date || p.end_date) ? (
                <Text style={{ color: palette.muted, fontSize: 11, marginTop: 2 }}>
                  {[p.start_date, p.end_date ?? (p.current ? 'present' : null)].filter(Boolean).join(' – ')}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {skills.length ? (
        <View style={styles.outerSection}>
          <Text style={[styles.label, { color: palette.muted }]}>SKILLS</Text>
          <View style={styles.chipRow}>
            {skills.map((s, i) => (
              <View
                key={`sk-${i}`}
                style={[
                  styles.chip,
                  { backgroundColor: palette.primary + '14', borderColor: palette.primary + '38' },
                ]}
              >
                <Text style={[styles.chipText, { color: palette.primary }]} numberOfLines={1}>
                  {s}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {education.length ? (
        <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border, borderRadius: radius }]}>
          <Text style={[styles.label, { color: palette.muted }]}>EDUCATION</Text>
          {education.slice(0, 3).map((e, i) => (
            <View key={`e-${i}`} style={{ marginTop: i === 0 ? 6 : 8 }}>
              <Text style={{ color: palette.text, fontSize: 14, fontFamily: 'Inter_600SemiBold' }} numberOfLines={2}>
                {String(e.school ?? e.university ?? '')}
              </Text>
              {(e.degree || e.field) ? (
                <Text style={{ color: palette.muted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                  {[e.degree, e.field].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {languages.length ? (
        <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border, borderRadius: radius }]}>
          <Text style={[styles.label, { color: palette.muted }]}>LANGUAGES</Text>
          <Text style={{ color: palette.text, fontSize: 14, marginTop: 6, lineHeight: 20 }}>
            {languages.join(', ')}
          </Text>
        </View>
      ) : null}

      {socialEntries.length ? (
        <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border, borderRadius: radius }]}>
          <Text style={[styles.label, { color: palette.muted }]}>SOCIAL PROFILES</Text>
          {socialEntries.map((s, i) => (
            <Pressable
              key={`s-${i}`}
              onPress={() => Linking.openURL(s.url).catch(() => {})}
              style={[styles.socialRow, { borderTopColor: palette.border, borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth }]}
            >
              <LinkIcon size={16} color={palette.muted} />
              <Text style={{ color: palette.text, fontSize: 13, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' }}>
                {s.label}
              </Text>
              <Text style={{ color: palette.muted, fontSize: 12, flex: 1 }} numberOfLines={1}>
                {s.url.replace(/^https?:\/\//, '')}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  outerSection: {
    paddingHorizontal: 18,
    gap: 8,
  },
  section: {
    marginHorizontal: 16,
    padding: 14,
    borderWidth: 0.5,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  bigText: {
    fontSize: 16,
    marginTop: 6,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '100%',
  },
  chipText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
});

export default ProfileInsights;
