import React from 'react';
import TokenBalance from './TokenBalance';
import AnnouncementBanner from './AnnouncementBanner';
import QuickFilters from './QuickFilters';
import LeadSwipeStack from './LeadSwipeStack';
import RecentLeadsCarousel from './RecentLeadsCarousel';
import ActionButtons from './ActionButtons';
import MetricCard from './MetricCard';
import Divider from './Divider';
import Spacer from './Spacer';
import HeroBanner from './HeroBanner';
import ProfileCard from './ProfileCard';
import StatGrid from './StatGrid';
import ProposalCard from './ProposalCard';
import ReferralBanner from './ReferralBanner';
import ChartCard from './ChartCard';
import SearchBar from './SearchBar';
import ActivityFeed from './ActivityFeed';
import LessonCard from './LessonCard';
import StreakCounter from './StreakCounter';
import TrendingPhrases from './TrendingPhrases';
import SuggestedLeads from './SuggestedLeads';
import ChannelMix from './ChannelMix';
import TokenForecast from './TokenForecast';
import VideoCard from './VideoCard';
import TestimonialQuote from './TestimonialQuote';
import FollowupReminder from './FollowupReminder';
import WhatsNewCard from './WhatsNewCard';

export const widgetRegistry: Record<string, React.FC<any>> = {
  TokenBalance,
  AnnouncementBanner,
  QuickFilters,
  LeadSwipeStack,
  RecentLeadsCarousel,
  ActionButtons,
  MetricCard,
  Divider,
  Spacer,
  HeroBanner,
  ProfileCard,
  StatGrid,
  ProposalCard,
  ReferralBanner,
  ChartCard,
  SearchBar,
  ActivityFeed,
  LessonCard,
  StreakCounter,
  TrendingPhrases,
  SuggestedLeads,
  ChannelMix,
  TokenForecast,
  VideoCard,
  TestimonialQuote,
  FollowupReminder,
  WhatsNewCard,
};

export function renderWidget(w: { type: string; props?: any }, key: string): React.ReactElement | null {
  const Cmp = widgetRegistry[w.type];
  if (!Cmp) return null;
  return React.createElement(Cmp, { key, ...(w.props || {}) });
}
