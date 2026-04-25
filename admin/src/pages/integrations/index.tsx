import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';

type Integration = {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'coming_soon';
  category: string;
  link?: string;
};

const INTEGRATIONS: Integration[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Multi-key Apify-powered scraping of LinkedIn search results and feed. Configured via the Scrapers page.',
    status: 'active',
    category: 'Scraping',
    link: '/scrapers',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'AI filtering, ICP scoring, and proposal generation. Uses Claude Haiku for fast, cost-efficient inference.',
    status: 'active',
    category: 'AI',
  },
  {
    id: 'signalhire',
    name: 'SignalHire',
    description: 'Enriches leads with verified email addresses and phone numbers. Credits are consumed per reveal.',
    status: 'active',
    category: 'Enrichment',
  },
  {
    id: 'apify',
    name: 'Apify',
    description: 'Scraper infrastructure. Supports multi-key rotation across 7 tokens to avoid LinkedIn rate limits.',
    status: 'active',
    category: 'Scraping',
  },
  {
    id: 'cashfree',
    name: 'Cashfree',
    description: 'Payment gateway for INR subscriptions and token top-ups. Supports UPI, cards, and net banking.',
    status: 'active',
    category: 'Payments',
  },
  {
    id: 'resend',
    name: 'Resend',
    description: 'Transactional email delivery — outreach emails, invoices, proposal PDFs, and system notifications.',
    status: 'active',
    category: 'Email',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'WhatsApp Business API for outreach sequences and lead follow-ups via mobile.',
    status: 'active',
    category: 'Messaging',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team notifications for new leads, scrape completions, and system alerts.',
    status: 'coming_soon',
    category: 'Notifications',
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Community and team channel notifications for lead events.',
    status: 'coming_soon',
    category: 'Notifications',
  },
  {
    id: 'posthog',
    name: 'PostHog',
    description: 'Product analytics and funnel tracking for admin and mobile app usage.',
    status: 'coming_soon',
    category: 'Analytics',
  },
  {
    id: 'sentry',
    name: 'Sentry',
    description: 'Error monitoring and performance tracing across server, admin, and mobile.',
    status: 'coming_soon',
    category: 'Monitoring',
  },
];

const CATEGORY_ORDER = ['Scraping', 'AI', 'Enrichment', 'Payments', 'Email', 'Messaging', 'Notifications', 'Analytics', 'Monitoring'];

function groupByCategory(integrations: Integration[]): Map<string, Integration[]> {
  const map = new Map<string, Integration[]>();
  for (const cat of CATEGORY_ORDER) {
    const items = integrations.filter((i) => i.category === cat);
    if (items.length > 0) map.set(cat, items);
  }
  return map;
}

export default function IntegrationsPage() {
  const grouped = groupByCategory(INTEGRATIONS);

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="Integrations"
        subtitle="Active integrations are live in production. Coming-soon items are planned for a future release."
      />

      {Array.from(grouped.entries()).map(([category, items]) => (
        <div key={category} className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{category}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((integration) => (
              <Card
                key={integration.id}
                className={integration.status === 'active' ? 'border-primary/30 bg-primary/3' : 'opacity-60'}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">{integration.name}</CardTitle>
                    <div className="flex gap-1.5">
                      {integration.status === 'active' && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-300">Active</Badge>
                      )}
                      {integration.status === 'coming_soon' && (
                        <Badge variant="secondary" className="text-xs">Coming soon</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">{integration.description}</p>
                  {integration.link && integration.status === 'active' && (
                    <a
                      href={integration.link}
                      className="text-xs text-primary underline-offset-2 hover:underline"
                    >
                      Configure →
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
