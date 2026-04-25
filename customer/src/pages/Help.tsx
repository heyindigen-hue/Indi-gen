import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon, MailIcon, HelpCircleIcon } from '@/icons';

type FaqItem = {
  question: string;
  answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'How do I add LinkedIn cookies?',
    answer:
      'Go to Settings → Integrations and paste your LinkedIn session cookie in the field provided. You can find this cookie by opening LinkedIn in your browser, opening DevTools (F12), going to Application → Cookies, and copying the value of "li_at".',
  },
  {
    question: 'How many leads can I scrape per day?',
    answer:
      'The number of leads you can scrape per day depends on your plan. Starter allows up to 50 leads/day, Pro allows 250 leads/day, and Agency allows unlimited scraping. Exceeding limits pauses scraping until the next day.',
  },
  {
    question: 'How do tokens work?',
    answer:
      'Tokens are consumed whenever AI features generate content — proposal drafts, outreach messages, and lead scoring all use tokens. Each plan includes a monthly token allowance. You can monitor your usage on the Insights page under "Token Usage".',
  },
  {
    question: 'How do I export leads to CSV?',
    answer:
      'Open the Leads page, optionally filter your leads, then click the "Export CSV" button in the top-right corner. All currently filtered leads will be downloaded as a CSV file including name, company, title, score, and status.',
  },
  {
    question: 'Can I white-label proposals?',
    answer:
      'Yes, white-labeling is available on the Agency plan. Go to Settings → Branding to upload your logo, set your brand colors, and configure the client-facing proposal URL. Clients will see your brand instead of LeadHangover.',
  },
  {
    question: 'How do I cancel my subscription?',
    answer:
      'You can cancel at any time from Settings → Billing → Cancel Subscription. Your plan remains active until the end of the current billing period. No refunds are issued for partial months. After cancellation, your data is retained for 30 days.',
  },
];

type VideoTutorial = {
  title: string;
  description: string;
  duration: string;
};

const VIDEO_TUTORIALS: VideoTutorial[] = [
  {
    title: 'Getting Started with LeadHangover',
    description: 'Set up your account, add LinkedIn cookies, and run your first scrape.',
    duration: '2 min',
  },
  {
    title: 'Building Your First Proposal',
    description: 'Learn how to use the AI proposal builder to create client-ready decks.',
    duration: '2 min',
  },
  {
    title: 'Outreach Automation Workflow',
    description: 'Set up LinkedIn and email sequences to follow up with leads automatically.',
    duration: '2 min',
  },
];

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y rounded-md border">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index}>
            <button
              className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span>{item.question}</span>
              {isOpen ? (
                <ChevronUpIcon className="h-4 w-4 shrink-0 text-muted-foreground ml-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground ml-4" />
              )}
            </button>
            {isOpen && (
              <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Help() {
  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="font-['Fraunces'] italic text-3xl font-semibold tracking-tight">
          How can we help?
        </h1>
        <p className="text-muted-foreground text-sm mt-2">
          Answers, tutorials, and support — all in one place.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircleIcon className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Frequently Asked Questions</h2>
        </div>
        <FaqAccordion items={FAQ_ITEMS} />
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-base font-semibold">Video Tutorials</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {VIDEO_TUTORIALS.map((video) => (
            <Card key={video.title} className="overflow-hidden">
              <div className="relative w-full bg-muted rounded-t-md" style={{ paddingBottom: '56.25%' }}>
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-10 w-10"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <CardContent className="p-3 space-y-1">
                <p className="text-sm font-medium leading-snug">{video.title}</p>
                <p className="text-xs text-muted-foreground leading-snug">{video.description}</p>
                <p className="text-xs text-primary font-medium pt-0.5">Watch ({video.duration})</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MailIcon className="h-4 w-4" />
                Contact Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                We respond within 24 hours on business days.
              </p>
              <Button asChild>
                <a href="mailto:support@leadhangover.com" className="gap-2">
                  <MailIcon className="h-4 w-4" />
                  Email Support
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ExternalLinkIcon className="h-4 w-4" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Check uptime and ongoing incidents on our status page.
              </p>
              <Button variant="outline" asChild>
                <a
                  href="https://status.leadhangover.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                  View Status
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
