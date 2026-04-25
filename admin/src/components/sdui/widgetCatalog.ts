import type { WidgetType } from '@/types/sdui';

export type WidgetGroup =
  | 'account'
  | 'stats'
  | 'leads'
  | 'engagement'
  | 'actions'
  | 'learn'
  | 'fun'
  | 'layout';

export interface SchemaField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'json';
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface WidgetCatalogEntry {
  type: WidgetType;
  label: string;
  description: string;
  group: WidgetGroup;
  defaultProps: Record<string, unknown>;
  fields: SchemaField[];
  colorDot: string;
}

export const WIDGET_CATALOG: WidgetCatalogEntry[] = [
  // ── Account & Tokens ─────────────────────────────────────────────────────
  {
    type: 'TokenBalance',
    label: 'Token Balance',
    description: 'Credit count + sparkline + top-up',
    group: 'account',
    defaultProps: { showTopUp: true },
    colorDot: '#3B82F6',
    fields: [
      { key: 'showTopUp', label: 'Show Top-up button', type: 'boolean' },
    ],
  },
  {
    type: 'ProfileCard',
    label: 'Profile Card',
    description: 'Avatar · name · plan · tokens row',
    group: 'account',
    defaultProps: { showAvatar: true, showPlan: true, showTokens: true },
    colorDot: '#6366F1',
    fields: [
      { key: 'showAvatar', label: 'Show Avatar', type: 'boolean' },
      { key: 'showPlan', label: 'Show Plan', type: 'boolean' },
      { key: 'showTokens', label: 'Show Tokens', type: 'boolean' },
    ],
  },
  {
    type: 'TokenForecast',
    label: 'Token Forecast',
    description: 'Estimated token runway in days',
    group: 'account',
    defaultProps: {},
    colorDot: '#8B5CF6',
    fields: [],
  },

  // ── Stats & Charts ────────────────────────────────────────────────────────
  {
    type: 'StatGrid',
    label: 'Stat Grid',
    description: '2×2 grid of mini stats',
    group: 'stats',
    defaultProps: {
      cells: [
        { label: 'Saved', value_key: 'leads_saved_30d', color: 'primary' },
        { label: 'Sent', value_key: 'sent_30d', color: 'warning' },
        { label: 'Reply %', value_key: 'reply_rate', color: 'success' },
        { label: 'Tokens', value_key: 'token_balance', color: 'accent' },
      ],
    },
    colorDot: '#EC4899',
    fields: [
      { key: 'cells', label: 'Cells (JSON array)', type: 'json' },
    ],
  },
  {
    type: 'ChartCard',
    label: 'Chart Card',
    description: 'Mini line chart — token burn, leads/day',
    group: 'stats',
    defaultProps: { metric_key: 'leads_per_day', range: '30d', color: 'primary' },
    colorDot: '#14B8A6',
    fields: [
      {
        key: 'metric_key', label: 'Metric', type: 'select',
        options: [
          { value: 'leads_per_day', label: 'Leads / day' },
          { value: 'tokens_used', label: 'Token burn' },
          { value: 'reply_rate', label: 'Reply rate' },
        ],
      },
      {
        key: 'range', label: 'Range', type: 'select',
        options: [
          { value: '7d', label: '7 days' },
          { value: '30d', label: '30 days' },
          { value: '90d', label: '90 days' },
        ],
      },
      {
        key: 'color', label: 'Color', type: 'select',
        options: [
          { value: 'primary', label: 'Primary' },
          { value: 'success', label: 'Success' },
          { value: 'warning', label: 'Warning' },
        ],
      },
    ],
  },
  {
    type: 'MetricCard',
    label: 'Metric Card',
    description: 'Single metric with optional trend',
    group: 'stats',
    defaultProps: { label: 'Metric', value: '0', trend: 'flat' },
    colorDot: '#F43F5E',
    fields: [
      { key: 'label', label: 'Label', type: 'text', placeholder: 'e.g. Total Leads' },
      { key: 'value', label: 'Value', type: 'text', placeholder: 'e.g. 124' },
      {
        key: 'trend', label: 'Trend', type: 'select',
        options: [
          { value: 'flat', label: 'Flat' },
          { value: 'up', label: 'Up' },
          { value: 'down', label: 'Down' },
        ],
      },
    ],
  },
  {
    type: 'ChannelMix',
    label: 'Channel Mix',
    description: 'Outreach channel breakdown',
    group: 'stats',
    defaultProps: { period: '30d' },
    colorDot: '#F97316',
    fields: [
      {
        key: 'period', label: 'Period', type: 'select',
        options: [
          { value: '7d', label: '7 days' },
          { value: '30d', label: '30 days' },
          { value: '90d', label: '90 days' },
        ],
      },
    ],
  },
  {
    type: 'TrendingPhrases',
    label: 'Trending Phrases',
    description: 'Top search phrases by lead yield',
    group: 'stats',
    defaultProps: { limit: 5 },
    colorDot: '#22C55E',
    fields: [
      { key: 'limit', label: 'Show', type: 'number', min: 3, max: 10 },
    ],
  },

  // ── Leads ─────────────────────────────────────────────────────────────────
  {
    type: 'LeadSwipeStack',
    label: 'Lead Swipe Stack',
    description: 'Card-swipe lead browser',
    group: 'leads',
    defaultProps: { maxCards: 5, showScore: false },
    colorDot: '#10B981',
    fields: [
      { key: 'maxCards', label: 'Max cards', type: 'number', min: 1, max: 20 },
      { key: 'showScore', label: 'Show match score', type: 'boolean' },
    ],
  },
  {
    type: 'RecentLeadsCarousel',
    label: 'Recent Leads Carousel',
    description: 'Horizontal scroll of recent saves',
    group: 'leads',
    defaultProps: { limit: 10 },
    colorDot: '#0D9488',
    fields: [
      { key: 'limit', label: 'Limit', type: 'number', min: 3, max: 20 },
    ],
  },
  {
    type: 'SuggestedLeads',
    label: 'Suggested Leads',
    description: 'AI-recommended hot leads',
    group: 'leads',
    defaultProps: { score_min: 7, limit: 5 },
    colorDot: '#059669',
    fields: [
      { key: 'score_min', label: 'Min score (1–10)', type: 'number', min: 1, max: 10 },
      { key: 'limit', label: 'Limit', type: 'number', min: 1, max: 20 },
    ],
  },
  {
    type: 'FollowupReminder',
    label: 'Follow-up Reminder',
    description: 'Leads needing follow-up count',
    group: 'leads',
    defaultProps: { days_threshold: 7 },
    colorDot: '#DC2626',
    fields: [
      { key: 'days_threshold', label: 'Days without reply', type: 'number', min: 1, max: 30 },
    ],
  },
  {
    type: 'ProposalCard',
    label: 'Proposal Card',
    description: 'Latest draft proposal preview',
    group: 'leads',
    defaultProps: {},
    colorDot: '#7C3AED',
    fields: [],
  },

  // ── Engagement ────────────────────────────────────────────────────────────
  {
    type: 'AnnouncementBanner',
    label: 'Announcement Banner',
    description: 'Dismissible announcement strip',
    group: 'engagement',
    defaultProps: { message: '', dismissable: false },
    colorDot: '#F59E0B',
    fields: [
      { key: 'message', label: 'Message', type: 'text', placeholder: 'Announcement text', required: true },
      { key: 'dismissable', label: 'Dismissable', type: 'boolean' },
    ],
  },
  {
    type: 'HeroBanner',
    label: 'Hero Banner',
    description: 'Illustration + headline + CTA',
    group: 'engagement',
    defaultProps: {
      title: 'Wake up to better leads',
      subtitle: '3 new buyers found overnight',
      illustration_id: 'hero-onboarding',
      cta_label: 'View leads',
      cta_route: '/(tabs)/explore',
    },
    colorDot: '#EF4444',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
      {
        key: 'illustration_id', label: 'Illustration', type: 'select',
        options: [
          { value: 'hero-onboarding', label: 'Onboarding Hero' },
          { value: 'leads-found', label: 'Leads Found' },
          { value: 'empty-state', label: 'Empty State' },
          { value: 'celebration', label: 'Celebration' },
        ],
      },
      { key: 'cta_label', label: 'CTA Label', type: 'text' },
      {
        key: 'cta_route', label: 'CTA Route', type: 'select',
        options: [
          { value: '/(tabs)/explore', label: 'Saved Leads' },
          { value: '/(tabs)/outreach', label: 'Outreach' },
          { value: '/(tabs)/insights', label: 'Insights' },
          { value: '/paywall', label: 'Paywall' },
        ],
      },
    ],
  },
  {
    type: 'ReferralBanner',
    label: 'Referral Banner',
    description: '"Invite friends, earn tokens" with code',
    group: 'engagement',
    defaultProps: { reward: 50 },
    colorDot: '#D97706',
    fields: [
      { key: 'reward', label: 'Token reward', type: 'number', min: 1 },
    ],
  },
  {
    type: 'WhatsNewCard',
    label: "What's New",
    description: 'Latest release notes preview',
    group: 'engagement',
    defaultProps: { limit: 3 },
    colorDot: '#6D28D9',
    fields: [
      { key: 'limit', label: 'Items to show', type: 'number', min: 1, max: 10 },
    ],
  },
  {
    type: 'TestimonialQuote',
    label: 'Testimonial Quote',
    description: 'Rotating quote from happy users',
    group: 'engagement',
    defaultProps: { set_id: 'default' },
    colorDot: '#BE185D',
    fields: [
      { key: 'set_id', label: 'Quote set', type: 'text', placeholder: 'default' },
    ],
  },

  // ── Actions ───────────────────────────────────────────────────────────────
  {
    type: 'ActionButtons',
    label: 'Action Buttons',
    description: 'Scrape / Import / Invite buttons',
    group: 'actions',
    defaultProps: { actions: ['scrape', 'import_manual', 'invite'] },
    colorDot: '#EA580C',
    fields: [
      { key: 'actionsRaw', label: 'Actions (comma-separated)', type: 'text', placeholder: 'scrape, import_manual, invite' },
    ],
  },
  {
    type: 'SearchBar',
    label: 'Search Bar',
    description: 'Tap-opens overlay search modal',
    group: 'actions',
    defaultProps: { placeholder: 'Search leads...' },
    colorDot: '#0EA5E9',
    fields: [
      { key: 'placeholder', label: 'Placeholder', type: 'text' },
    ],
  },
  {
    type: 'QuickFilters',
    label: 'Quick Filters',
    description: 'Horizontal scroll filter chips',
    group: 'actions',
    defaultProps: { filters: ['BUYER_PROJECT', 'D2C', 'SaaS', 'Recent'] },
    colorDot: '#7C3AED',
    fields: [
      { key: 'filtersRaw', label: 'Filters (comma-separated)', type: 'text', placeholder: 'BUYER_PROJECT, D2C, SaaS' },
    ],
  },

  // ── Learn ─────────────────────────────────────────────────────────────────
  {
    type: 'LessonCard',
    label: 'Lesson Card',
    description: 'Daily tip carousel',
    group: 'learn',
    defaultProps: { lesson_set_id: 'default' },
    colorDot: '#0284C7',
    fields: [
      { key: 'lesson_set_id', label: 'Lesson set', type: 'text', placeholder: 'default' },
    ],
  },
  {
    type: 'VideoCard',
    label: 'Video Card',
    description: 'Embedded tutorial video',
    group: 'learn',
    defaultProps: { video_url: '', title: 'Tutorial', thumbnail: '' },
    colorDot: '#DC2626',
    fields: [
      { key: 'video_url', label: 'Video URL', type: 'text', placeholder: 'https://...' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'thumbnail', label: 'Thumbnail URL', type: 'text' },
    ],
  },
  {
    type: 'ActivityFeed',
    label: 'Activity Feed',
    description: 'Last N events for this user',
    group: 'learn',
    defaultProps: { limit: 10 },
    colorDot: '#475569',
    fields: [
      { key: 'limit', label: 'Show', type: 'number', min: 5, max: 20 },
    ],
  },

  // ── Fun ───────────────────────────────────────────────────────────────────
  {
    type: 'StreakCounter',
    label: 'Streak Counter',
    description: 'Daily login / scrape streak flame',
    group: 'fun',
    defaultProps: { type: 'login' },
    colorDot: '#F97316',
    fields: [
      {
        key: 'type', label: 'Streak type', type: 'select',
        options: [
          { value: 'login', label: 'Login streak' },
          { value: 'scrape', label: 'Scrape streak' },
        ],
      },
    ],
  },

  // ── Layout ────────────────────────────────────────────────────────────────
  {
    type: 'Divider',
    label: 'Divider',
    description: 'Horizontal rule',
    group: 'layout',
    defaultProps: { thickness: 1 },
    colorDot: '#94A3B8',
    fields: [
      { key: 'thickness', label: 'Thickness (px)', type: 'number', min: 1, max: 8 },
    ],
  },
  {
    type: 'Spacer',
    label: 'Spacer',
    description: 'Vertical whitespace',
    group: 'layout',
    defaultProps: { height: 16 },
    colorDot: '#CBD5E1',
    fields: [
      { key: 'height', label: 'Height (px)', type: 'number', min: 4, max: 200 },
    ],
  },
  {
    type: 'CustomHtml',
    label: 'Custom HTML',
    description: 'Raw HTML / markdown block',
    group: 'layout',
    defaultProps: { html: '' },
    colorDot: '#64748B',
    fields: [
      { key: 'html', label: 'HTML', type: 'textarea', placeholder: '<div>...</div>' },
    ],
  },
];

export const WIDGET_CATALOG_MAP: Record<WidgetType, WidgetCatalogEntry> = Object.fromEntries(
  WIDGET_CATALOG.map((e) => [e.type, e]),
) as Record<WidgetType, WidgetCatalogEntry>;

export const WIDGET_GROUPS: { id: WidgetGroup; label: string; icon: string }[] = [
  { id: 'account',    label: 'Account & Tokens',  icon: '🪙' },
  { id: 'stats',      label: 'Stats & Charts',     icon: '📊' },
  { id: 'leads',      label: 'Leads',              icon: '🎯' },
  { id: 'engagement', label: 'Engagement',         icon: '📣' },
  { id: 'actions',    label: 'Actions',            icon: '⚡' },
  { id: 'learn',      label: 'Learn',              icon: '📚' },
  { id: 'fun',        label: 'Fun',                icon: '🌟' },
  { id: 'layout',     label: 'Layout',             icon: '📐' },
];
