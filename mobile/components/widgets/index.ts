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
};

export function renderWidget(w: { type: string; props?: any }, key: string): React.ReactElement | null {
  const Cmp = widgetRegistry[w.type];
  if (!Cmp) return null;
  return React.createElement(Cmp, { key, ...(w.props || {}) });
}
