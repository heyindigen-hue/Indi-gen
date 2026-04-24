import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import Login from '@/pages/Login';
import Dashboard from '@/pages/dashboard';
import UsersPage from '@/pages/users/index';
import UserDetailPage from '@/pages/users/[id]';
import InvitesPage from '@/pages/users/invites';
import WaitlistPage from '@/pages/users/waitlist';
import LeadsPage from '@/pages/leads/index';
import EnrichmentPage from '@/pages/leads/enrichment';
import AddLeadPage from '@/pages/leads/add';
import ScrapersPage from '@/pages/scrapers/index';
import ScraperRunsPage from '@/pages/scrapers/runs';
import ScraperAccountsPage from '@/pages/scrapers/accounts';
import ScraperSchedulesPage from '@/pages/scrapers/schedules';
import PromptsPage from '@/pages/ai/prompts';
import AiContextPage from '@/pages/ai/context';
import AiUsagePage from '@/pages/ai/usage';
import PlansPage from '@/pages/billing/plans';
import SubscriptionsPage from '@/pages/billing/subscriptions';
import InvoicesPage from '@/pages/billing/invoices';
import RefundsPage from '@/pages/billing/refunds';
import CouponsPage from '@/pages/billing/coupons';
import CashfreePage from '@/pages/integrations/cashfree';
import AnthropicPage from '@/pages/integrations/anthropic';
import SignalHirePage from '@/pages/integrations/signalhire';
import LinkedInPage from '@/pages/integrations/linkedin';
import ProxiesPage from '@/pages/integrations/proxies';
import EmailPage from '@/pages/integrations/email';
import WhatsAppPage from '@/pages/integrations/whatsapp';
import MobileUiLayout from '@/pages/mobile-ui/layout';
import MobileUiHomePage from '@/pages/mobile-ui/home';
import MobileUiTabsPage from '@/pages/mobile-ui/tabs';
import MobileUiOnboardingPage from '@/pages/mobile-ui/onboarding';
import MobileUiPaywallPage from '@/pages/mobile-ui/paywall';
import MobileUiThemePage from '@/pages/mobile-ui/theme';
import MobileUiStringsPage from '@/pages/mobile-ui/strings';
import MobileUiTemplatesPage from '@/pages/mobile-ui/templates';
import BrandPage from '@/pages/settings/brand';
import CompanyPage from '@/pages/settings/company';
import LegalPage from '@/pages/settings/legal';
import SettingsTemplatesPage from '@/pages/settings/templates';
import FlagsPage from '@/pages/settings/flags';
import MaintenancePage from '@/pages/settings/maintenance';
import AdminsPage from '@/pages/security/admins';
import SessionsPage from '@/pages/security/sessions';
import ApiKeysPage from '@/pages/security/api-keys';
import AuditPage from '@/pages/security/audit';
import DpdpPage from '@/pages/security/dpdp';
import LogsPage from '@/pages/platform/logs';
import ErrorsPage from '@/pages/platform/errors';
import WebhooksPage from '@/pages/platform/webhooks';
import { useAuth } from '@/store/auth';
import { PageHeader } from '@/components/common/PageHeader';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuth((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PlaceholderPage({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="flex items-center justify-center h-64 border border-dashed border-border rounded-lg">
        <p className="text-sm text-muted-foreground">Coming soon</p>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="text-muted-foreground mt-2">Page not found</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />

        {/* Users */}
        <Route path="users" element={<UsersPage />} />
        <Route path="users/invites" element={<InvitesPage />} />
        <Route path="users/waitlist" element={<WaitlistPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="users/verification" element={<PlaceholderPage title="User Verification" />} />
        <Route path="users/activity" element={<PlaceholderPage title="User Activity" />} />
        <Route path="users/roles" element={<PlaceholderPage title="Roles & Permissions" />} />

        {/* Leads */}
        <Route path="leads" element={<LeadsPage />} />
        <Route path="leads/enrichment" element={<EnrichmentPage />} />
        <Route path="leads/add" element={<AddLeadPage />} />
        <Route path="leads/scoring" element={<PlaceholderPage title="Lead Scoring" />} />
        <Route path="leads/export" element={<PlaceholderPage title="Lead Export" />} />

        {/* Scrapers */}
        <Route path="scrapers" element={<ScrapersPage />} />
        <Route path="scrapers/runs" element={<ScraperRunsPage />} />
        <Route path="scrapers/accounts" element={<ScraperAccountsPage />} />
        <Route path="scrapers/schedules" element={<ScraperSchedulesPage />} />
        <Route path="scrapers/sources" element={<PlaceholderPage title="Scraper Sources" />} />
        <Route path="scrapers/logs" element={<PlaceholderPage title="Scraper Logs" />} />

        {/* AI */}
        <Route path="ai" element={<PlaceholderPage title="AI Models" description="Manage AI configuration" />} />
        <Route path="ai/prompts" element={<PromptsPage />} />
        <Route path="ai/context" element={<AiContextPage />} />
        <Route path="ai/usage" element={<AiUsagePage />} />

        {/* Integrations */}
        <Route
          path="integrations"
          element={<PlaceholderPage title="Integrations" description="Manage third-party integrations" />}
        />
        <Route path="integrations/cashfree" element={<CashfreePage />} />
        <Route path="integrations/anthropic" element={<AnthropicPage />} />
        <Route path="integrations/signalhire" element={<SignalHirePage />} />
        <Route path="integrations/linkedin" element={<LinkedInPage />} />
        <Route path="integrations/proxies" element={<ProxiesPage />} />
        <Route path="integrations/email" element={<EmailPage />} />
        <Route path="integrations/whatsapp" element={<WhatsAppPage />} />

        {/* Billing */}
        <Route path="billing" element={<PlaceholderPage title="Billing" description="Revenue and subscriptions" />} />
        <Route path="billing/plans" element={<PlansPage />} />
        <Route path="billing/subscriptions" element={<SubscriptionsPage />} />
        <Route path="billing/invoices" element={<InvoicesPage />} />
        <Route path="billing/refunds" element={<RefundsPage />} />
        <Route path="billing/coupons" element={<CouponsPage />} />

        {/* Mobile UI */}
        <Route path="mobile-ui" element={<MobileUiLayout />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<MobileUiHomePage />} />
          <Route path="tabs" element={<MobileUiTabsPage />} />
          <Route path="onboarding" element={<MobileUiOnboardingPage />} />
          <Route path="paywall" element={<MobileUiPaywallPage />} />
          <Route path="theme" element={<MobileUiThemePage />} />
          <Route path="strings" element={<MobileUiStringsPage />} />
          <Route path="templates" element={<MobileUiTemplatesPage />} />
        </Route>

        {/* Settings */}
        <Route path="settings" element={<PlaceholderPage title="Settings" description="Platform configuration" />} />
        <Route path="settings/brand" element={<BrandPage />} />
        <Route path="settings/company" element={<CompanyPage />} />
        <Route path="settings/legal" element={<LegalPage />} />
        <Route path="settings/templates" element={<SettingsTemplatesPage />} />
        <Route path="settings/flags" element={<FlagsPage />} />
        <Route path="settings/maintenance" element={<MaintenancePage />} />

        {/* Security */}
        <Route path="security" element={<PlaceholderPage title="Security" description="Platform security overview" />} />
        <Route path="security/admins" element={<AdminsPage />} />
        <Route path="security/sessions" element={<SessionsPage />} />
        <Route path="security/api-keys" element={<ApiKeysPage />} />
        <Route path="security/audit" element={<AuditPage />} />
        <Route path="security/dpdp" element={<DpdpPage />} />

        {/* Platform */}
        <Route path="platform" element={<PlaceholderPage title="Platform" description="Infrastructure overview" />} />
        <Route path="platform/logs" element={<LogsPage />} />
        <Route path="platform/errors" element={<ErrorsPage />} />
        <Route path="platform/webhooks" element={<WebhooksPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
