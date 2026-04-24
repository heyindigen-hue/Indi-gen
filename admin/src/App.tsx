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
        <Route path="ai/prompts" element={<PlaceholderPage title="AI Prompts" />} />
        <Route path="ai/usage" element={<PlaceholderPage title="AI Usage" />} />

        {/* Integrations */}
        <Route
          path="integrations"
          element={<PlaceholderPage title="Integrations" description="Manage third-party integrations" />}
        />
        <Route path="integrations/webhooks" element={<PlaceholderPage title="Webhooks" />} />
        <Route path="integrations/api-keys" element={<PlaceholderPage title="API Keys" />} />
        <Route path="integrations/oauth" element={<PlaceholderPage title="OAuth Apps" />} />
        <Route path="integrations/linkedin" element={<PlaceholderPage title="LinkedIn Integration" />} />
        <Route path="integrations/crm" element={<PlaceholderPage title="CRM Integration" />} />
        <Route path="integrations/notifications" element={<PlaceholderPage title="Notification Channels" />} />

        {/* Billing */}
        <Route path="billing" element={<PlaceholderPage title="Billing" description="Revenue and subscriptions" />} />
        <Route path="billing/plans" element={<PlaceholderPage title="Plans" />} />
        <Route path="billing/transactions" element={<PlaceholderPage title="Transactions" />} />
        <Route path="billing/credits" element={<PlaceholderPage title="Credits" />} />
        <Route path="billing/gst" element={<PlaceholderPage title="GST Reports" />} />

        {/* Mobile UI */}
        <Route
          path="mobile-ui"
          element={<PlaceholderPage title="Mobile UI" description="SDUI screen management" />}
        />
        <Route path="mobile-ui/navigation" element={<PlaceholderPage title="Navigation" />} />
        <Route path="mobile-ui/components" element={<PlaceholderPage title="Components" />} />
        <Route path="mobile-ui/themes" element={<PlaceholderPage title="Themes" />} />
        <Route path="mobile-ui/assets" element={<PlaceholderPage title="Assets" />} />
        <Route path="mobile-ui/announcements" element={<PlaceholderPage title="Announcements" />} />

        {/* Settings */}
        <Route path="settings" element={<PlaceholderPage title="Settings" description="Platform configuration" />} />
        <Route path="settings/emails" element={<PlaceholderPage title="Email Settings" />} />
        <Route path="settings/maintenance" element={<PlaceholderPage title="Maintenance Mode" />} />
        <Route path="settings/features" element={<PlaceholderPage title="Feature Flags" />} />
        <Route path="settings/dpdp" element={<PlaceholderPage title="DPDP Compliance" />} />
        <Route path="settings/audit" element={<PlaceholderPage title="Audit Log" />} />

        {/* Security */}
        <Route path="security" element={<PlaceholderPage title="Security" description="Platform security overview" />} />
        <Route path="security/sessions" element={<PlaceholderPage title="Active Sessions" />} />
        <Route path="security/ip-allowlist" element={<PlaceholderPage title="IP Allowlist" />} />
        <Route path="security/rate-limits" element={<PlaceholderPage title="Rate Limits" />} />
        <Route path="security/alerts" element={<PlaceholderPage title="Security Alerts" />} />

        {/* Platform */}
        <Route path="platform" element={<PlaceholderPage title="Platform" description="Infrastructure overview" />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
