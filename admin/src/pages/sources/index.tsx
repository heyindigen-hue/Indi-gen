import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';

type Source = {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'coming_soon';
  badge?: string;
};

const SOURCES: Source[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Scrape LinkedIn posts from search results and feed. Powered by Apify with multi-key rotation.',
    status: 'active',
    badge: 'Primary',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    description: 'Monitor subreddits for intent signals. Posts with buying intent surface as leads.',
    status: 'coming_soon',
  },
  {
    id: 'twitter',
    name: 'X / Twitter',
    description: 'Search Twitter for prospect posts matching your ICP keywords.',
    status: 'coming_soon',
  },
  {
    id: 'producthunt',
    name: 'Product Hunt',
    description: 'Find founders launching SaaS products that match your ICP.',
    status: 'coming_soon',
  },
  {
    id: 'hackernews',
    name: 'Hacker News',
    description: "Monitor \"Ask HN: Who's hiring?\" and similar high-signal threads.",
    status: 'coming_soon',
  },
  {
    id: 'indiamart',
    name: 'IndiaMart',
    description: 'Source Indian SME buyer leads from IndiaMart listings.',
    status: 'coming_soon',
  },
  {
    id: 'goodfirms',
    name: 'GoodFirms',
    description: 'B2B software directory with company decision-maker contacts.',
    status: 'coming_soon',
  },
];

export default function SourcesPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Sources"
        subtitle="Lead sources — currently focused on LinkedIn only. More platforms coming soon."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SOURCES.map((source) => (
          <Card
            key={source.id}
            className={source.status === 'active' ? 'border-primary/30 bg-primary/3' : 'opacity-70'}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">{source.name}</CardTitle>
                <div className="flex gap-1.5">
                  {source.badge && (
                    <Badge variant="default" className="text-xs">{source.badge}</Badge>
                  )}
                  {source.status === 'coming_soon' && (
                    <Badge variant="secondary" className="text-xs">Coming soon</Badge>
                  )}
                  {source.status === 'active' && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-300">Active</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{source.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Platform focus is intentionally LinkedIn-first. Additional sources will be unlocked as they reach production quality.
      </p>
    </div>
  );
}
