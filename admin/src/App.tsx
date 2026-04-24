import { Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/dashboard';
import UsersPage from './pages/users';
import LeadsPage from './pages/leads';
import ScrapersPage from './pages/scrapers';
import AiPage from './pages/ai';
import IntegrationsPage from './pages/integrations';
import SourcesPage from './pages/sources';
import FinancialPage from './pages/financial';
import GrowthPage from './pages/growth';
import SupportPage from './pages/support';
import PlatformPage from './pages/platform';
import MobilePage from './pages/mobile';
import TeamPage from './pages/team';
import ConfigPage from './pages/config';
import SecurityPage from './pages/security';
import DeveloperPage from './pages/developer';

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4">
        <h1 className="text-xl font-bold">Indi-gen Admin — scaffold ready</h1>
      </header>
      <main className="p-4">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/scrapers" element={<ScrapersPage />} />
          <Route path="/ai" element={<AiPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="/financial" element={<FinancialPage />} />
          <Route path="/growth" element={<GrowthPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/platform" element={<PlatformPage />} />
          <Route path="/mobile" element={<MobilePage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/config" element={<ConfigPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/developer" element={<DeveloperPage />} />
        </Routes>
      </main>
    </div>
  );
}
