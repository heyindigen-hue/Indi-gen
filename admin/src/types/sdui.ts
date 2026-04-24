export type WidgetType =
  | 'TokenBalance'
  | 'AnnouncementBanner'
  | 'QuickFilters'
  | 'LeadSwipeStack'
  | 'RecentLeadsCarousel'
  | 'ActionButtons'
  | 'MetricCard'
  | 'CustomHtml'
  | 'Divider'
  | 'Spacer';

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  props: Record<string, unknown>;
}

export interface TabItem {
  id: string;
  icon: string;
  label: string;
  route: string;
  enabled: boolean;
  order: number;
}

export interface OnboardingStep {
  id: string;
  title: string;
  body: string;
  illustrationUrl: string;
  inputType: 'none' | 'chip' | 'text' | 'select' | 'skip';
  options: string[];
  validationRegex: string;
  animated: boolean;
  order: number;
}

export interface PaywallBundle {
  id: string;
  tokens: number;
  price_inr: number;
  badge: string;
  savings: string;
  order: number;
}

export interface ThemeConfig {
  preset: 'graphite' | 'vercel' | 'cron' | 'custom';
  colors: {
    bg: string;
    card: string;
    border: string;
    text: string;
    muted: string;
    accent: string;
    success: string;
    warning: string;
    destructive: string;
  };
  font: 'inter' | 'geist' | 'system';
  radius: number;
  density: 'compact' | 'comfortable' | 'spacious';
}

export interface ManifestScreen {
  widgets?: WidgetInstance[];
  tabs?: TabItem[];
  onboarding?: OnboardingStep[];
  paywall?: {
    headline: string;
    subheadline: string;
    bundles: PaywallBundle[];
    footerText: string;
  };
  theme?: ThemeConfig;
}

export interface Manifest {
  id: string;
  platform: 'mobile';
  version: number;
  enabled: boolean;
  created_at: string;
  screens: {
    home?: ManifestScreen;
    tabs?: ManifestScreen;
    onboarding?: ManifestScreen;
    paywall?: ManifestScreen;
    theme?: ManifestScreen;
  };
}
