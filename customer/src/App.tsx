import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import Login from '@/pages/Login';
import PhoneLogin from '@/pages/PhoneLogin';
import Signup from '@/pages/Signup';
import Onboarding from '@/pages/Onboarding';
import Home from '@/pages/Home';
import Leads from '@/pages/Leads';
import LeadDetail from '@/pages/LeadDetail';
import Proposals from '@/pages/Proposals';
import ProposalDetail from '@/pages/ProposalDetail';
import Outreach from '@/pages/Outreach';
import Insights from '@/pages/Insights';
import Scrape from '@/pages/Scrape';
import Help from '@/pages/Help';
import Settings from '@/pages/settings/index';
import AccountPage from '@/pages/settings/Account';
import CompanyPage from '@/pages/settings/Company';
import BillingPage from '@/pages/settings/Billing';
import NotificationsPage from '@/pages/settings/Notifications';
import IntegrationsPage from '@/pages/settings/Integrations';
import BrandingPage from '@/pages/settings/Branding';
import { useAuth } from '@/store/auth';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuth((s) => s.token);
  const user = useAuth((s) => s.user);

  if (!token) return <Navigate to="/login" replace />;

  if (user?.role === 'admin' || user?.role === 'super_admin') {
    window.location.href = '/admin';
    return null;
  }

  if (user && !user.onboarding_completed_at) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function RequireOnboarded({ children }: { children: React.ReactNode }) {
  const token = useAuth((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1
          className="text-5xl font-semibold text-foreground"
          style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic' }}
        >
          404
        </h1>
        <p className="text-muted-foreground mt-2">Page not found</p>
        <a href="/" className="mt-4 inline-block text-primary underline text-sm">
          Go home
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PhoneLogin />} />
      <Route path="/login/email" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/onboarding"
        element={
          <RequireOnboarded>
            <Onboarding />
          </RequireOnboarded>
        }
      />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Home />} />
        <Route path="leads" element={<Leads />} />
        <Route path="leads/:id" element={<LeadDetail />} />
        <Route path="proposals" element={<Proposals />} />
        <Route path="proposals/:id" element={<ProposalDetail />} />
        <Route path="outreach" element={<Outreach />} />
        <Route path="insights" element={<Insights />} />
        <Route path="scrape" element={<Scrape />} />
        <Route path="help" element={<Help />} />
        <Route path="settings" element={<Settings />}>
          <Route index element={<Navigate to="account" replace />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="company" element={<CompanyPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="branding" element={<BrandingPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
