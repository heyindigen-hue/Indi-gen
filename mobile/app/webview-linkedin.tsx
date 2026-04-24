import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../lib/themeContext';
import { api } from '../lib/api';
import { XIcon, ChevronLeftIcon, PlusIcon, CheckIcon, LeadIcon } from '../components/icons';

const LINKEDIN_URL = 'https://www.linkedin.com';

const EXTRACT_SCRIPT = `
(function() {
  try {
    const url = window.location.href;
    const nameEl = document.querySelector('h1');
    const headlineEl = document.querySelector('.text-body-medium.break-words') ||
                       document.querySelector('[data-field="headline"]') ||
                       document.querySelector('.pv-text-details__left-panel .text-body-medium');
    const companyEl = document.querySelector('[aria-label*="company"]') ||
                      document.querySelector('.pv-text-details__right-panel .inline-show-more-text') ||
                      document.querySelector('.experience-item__title');
    const postEl = document.querySelector('.feed-shared-update-v2__description .break-words') ||
                   document.querySelector('.attributed-text-segment-list__content');
    window.ReactNativeWebView.postMessage(JSON.stringify({
      url,
      name: nameEl ? nameEl.innerText.trim() : '',
      headline: headlineEl ? headlineEl.innerText.trim() : '',
      company: companyEl ? companyEl.innerText.trim() : '',
      latestPost: postEl ? postEl.innerText.trim().slice(0, 500) : '',
    }));
  } catch(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ url: window.location.href, name: '', headline: '', company: '', latestPost: '', error: e.message }));
  }
})();
`;

type ExtractedLead = {
  url: string;
  name: string;
  headline: string;
  company: string;
  latestPost: string;
};

function ConfirmSheet({
  lead,
  onSave,
  onDismiss,
  saving,
}: {
  lead: ExtractedLead;
  onSave: () => void;
  onDismiss: () => void;
  saving: boolean;
}) {
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={StyleSheet.absoluteFill}
    >
      <TouchableOpacity
        style={[sh.backdrop]}
        onPress={onDismiss}
        activeOpacity={1}
      />
      <View
        style={[
          sh.sheet,
          {
            backgroundColor: palette.card,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <View style={[sh.handle, { backgroundColor: palette.border }]} />
        <View style={sh.sheetHeader}>
          <Text style={[sh.sheetTitle, { color: palette.text }]}>Add this lead</Text>
          <TouchableOpacity onPress={onDismiss}>
            <XIcon size={20} color={palette.muted} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={sh.sheetScroll}
          contentContainerStyle={{ paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {lead.name ? (
            <Field label="Name" value={lead.name} palette={palette} />
          ) : null}
          {lead.headline ? (
            <Field label="Headline" value={lead.headline} palette={palette} />
          ) : null}
          {lead.company ? (
            <Field label="Company" value={lead.company} palette={palette} />
          ) : null}
          {lead.url ? (
            <Field label="Profile URL" value={lead.url} palette={palette} />
          ) : null}
          {lead.latestPost ? (
            <Field label="Latest post" value={lead.latestPost} palette={palette} />
          ) : null}
        </ScrollView>

        <TouchableOpacity
          onPress={onSave}
          disabled={saving}
          style={[sh.saveBtn, { backgroundColor: palette.primary, borderRadius: radius, marginHorizontal: 20 }]}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={palette.primaryFg} />
          ) : (
            <>
              <CheckIcon size={16} color={palette.primaryFg} strokeWidth={2} />
              <Text style={[sh.saveBtnText, { color: palette.primaryFg }]}>Save lead</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  palette,
}: {
  label: string;
  value: string;
  palette: ReturnType<typeof useTheme>['palette'];
}) {
  return (
    <View style={sh.field}>
      <Text style={[sh.fieldLabel, { color: palette.muted }]}>{label}</Text>
      <Text style={[sh.fieldValue, { color: palette.text }]} numberOfLines={4}>
        {value}
      </Text>
    </View>
  );
}

const sh = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '70%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  sheetScroll: {
    paddingHorizontal: 20,
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});

export default function WebviewLinkedInScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);

  const [loading, setLoading] = useState(true);
  const [extractedLead, setExtractedLead] = useState<ExtractedLead | null>(null);
  const [saving, setSaving] = useState(false);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as ExtractedLead;
      setExtractedLead(data);
    } catch {
      Alert.alert('Could not read page', 'Make sure you are on a LinkedIn profile page.');
    }
  };

  const handleAddLead = () => {
    webViewRef.current?.injectJavaScript(EXTRACT_SCRIPT);
  };

  const handleSave = async () => {
    if (!extractedLead) return;
    setSaving(true);
    try {
      await api.post('/leads/manual', {
        name: extractedLead.name,
        headline: extractedLead.headline,
        company: extractedLead.company,
        linkedin_url: extractedLead.url,
        latest_post: extractedLead.latestPost,
        source: 'linkedin_webview',
      });
      setExtractedLead(null);
      Alert.alert('Lead saved', `${extractedLead.name || 'Lead'} has been added.`);
    } catch {
      Alert.alert('Save failed', 'Could not save lead. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[wv.root, { backgroundColor: palette.bg }]}>
      {/* nav bar */}
      <View
        style={[
          wv.navbar,
          {
            paddingTop: insets.top + 8,
            backgroundColor: palette.card,
            borderBottomColor: palette.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={wv.navBack}>
          <ChevronLeftIcon size={22} color={palette.text} strokeWidth={1.5} />
        </TouchableOpacity>
        <View style={wv.navTitleWrap}>
          <LeadIcon size={16} color={palette.primary} strokeWidth={1.5} />
          <Text style={[wv.navTitle, { color: palette.text }]}>LinkedIn</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="small" color={palette.primary} style={{ marginRight: 16 }} />
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      {/* webview */}
      <WebView
        ref={webViewRef}
        source={{ uri: LINKEDIN_URL }}
        style={{ flex: 1 }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        userAgent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={handleAddLead}
        style={[
          wv.fab,
          {
            backgroundColor: palette.primary,
            bottom: insets.bottom + 24,
          },
        ]}
        activeOpacity={0.88}
      >
        <PlusIcon size={18} color={palette.primaryFg} strokeWidth={2} />
        <Text style={[wv.fabText, { color: palette.primaryFg }]}>Add this lead</Text>
      </TouchableOpacity>

      {/* confirmation sheet */}
      {extractedLead ? (
        <ConfirmSheet
          lead={extractedLead}
          onSave={handleSave}
          onDismiss={() => setExtractedLead(null)}
          saving={saving}
        />
      ) : null}
    </View>
  );
}

const wv = StyleSheet.create({
  root: {
    flex: 1,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  navBack: {
    padding: 4,
    width: 38,
  },
  navTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  fab: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
