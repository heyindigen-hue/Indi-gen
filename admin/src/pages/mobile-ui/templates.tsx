import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MailIcon, BellIcon } from '@/icons';
import { api } from '@/lib/api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TemplateList } from './_templates/TemplateList';
import { EmailEditor } from './_templates/EmailEditor';
import { PushEditor } from './_templates/PushEditor';

// ── Types ────────────────────────────────────────────────────────────────────

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  updated_at: string;
}

interface PushTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  variables: string[];
  updated_at: string;
}

// ── Fallback data ─────────────────────────────────────────────────────────────

const EMAIL_FALLBACK: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to Indi-gen!',
    body: 'Hi {{name}},\n\nWelcome aboard...',
    variables: ['{{name}}', '{{link}}'],
    updated_at: new Date().toISOString(),
  },
  {
    id: 'otp',
    name: 'OTP Email',
    subject: 'Your verification code',
    body: 'Your OTP is {{otp}}. Valid for 10 minutes.',
    variables: ['{{otp}}'],
    updated_at: new Date().toISOString(),
  },
];

const PUSH_FALLBACK: PushTemplate[] = [
  {
    id: 'new-lead',
    name: 'New Lead Alert',
    title: 'New lead available!',
    body: 'A new {{industry}} lead just arrived.',
    variables: ['{{industry}}'],
    updated_at: new Date().toISOString(),
  },
  {
    id: 'token-low',
    name: 'Token Low',
    title: 'Tokens running low',
    body: 'You have {{count}} tokens left. Top up now.',
    variables: ['{{count}}'],
    updated_at: new Date().toISOString(),
  },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedPushId, setSelectedPushId] = useState<string | null>(null);
  const [emailSheetOpen, setEmailSheetOpen] = useState(false);
  const [pushSheetOpen, setPushSheetOpen] = useState(false);

  const { data: emailData, isLoading: loadingEmail } = useQuery<{ templates: EmailTemplate[] }>({
    queryKey: ['admin-templates-email'],
    queryFn: () => api.get('/admin/templates/email'),
  });

  const { data: pushData, isLoading: loadingPush } = useQuery<{ templates: PushTemplate[] }>({
    queryKey: ['admin-templates-push'],
    queryFn: () => api.get('/admin/templates/push'),
  });

  const emailTemplates = emailData?.templates?.length ? emailData.templates : EMAIL_FALLBACK;
  const pushTemplates = pushData?.templates?.length ? pushData.templates : PUSH_FALLBACK;

  const selectedEmailTemplate = emailTemplates.find((t) => t.id === selectedEmailId) ?? null;
  const selectedPushTemplate = pushTemplates.find((t) => t.id === selectedPushId) ?? null;

  const handleEmailSelect = (id: string) => {
    setSelectedEmailId(id);
    setEmailSheetOpen(true);
  };

  const handlePushSelect = (id: string) => {
    setSelectedPushId(id);
    setPushSheetOpen(true);
  };

  const emailListItems = emailTemplates.map((t) => ({
    id: t.id,
    name: t.name,
    preview: t.subject,
  }));

  const pushListItems = pushTemplates.map((t) => ({
    id: t.id,
    name: t.name,
    preview: t.title,
  }));

  return (
    <div>
      <Tabs defaultValue="email">
        <TabsList className="mb-5">
          <TabsTrigger value="email" className="flex items-center gap-1.5">
            <MailIcon size={14} />
            Email
          </TabsTrigger>
          <TabsTrigger value="push" className="flex items-center gap-1.5">
            <BellIcon size={14} />
            Push
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <div className="flex gap-5">
            <TemplateList
              items={emailListItems}
              selectedId={selectedEmailId}
              onSelect={handleEmailSelect}
              loading={loadingEmail}
            />
            <div className="flex-1 flex items-center justify-center rounded-lg border border-dashed border-border min-h-[200px]">
              <p className="text-sm text-muted-foreground">
                Select a template to edit
              </p>
            </div>
          </div>

          <EmailEditor
            template={selectedEmailTemplate}
            open={emailSheetOpen}
            onClose={() => setEmailSheetOpen(false)}
          />
        </TabsContent>

        <TabsContent value="push">
          <div className="flex gap-5">
            <TemplateList
              items={pushListItems}
              selectedId={selectedPushId}
              onSelect={handlePushSelect}
              loading={loadingPush}
            />
            <div className="flex-1 flex items-center justify-center rounded-lg border border-dashed border-border min-h-[200px]">
              <p className="text-sm text-muted-foreground">
                Select a template to edit
              </p>
            </div>
          </div>

          <PushEditor
            template={selectedPushTemplate}
            open={pushSheetOpen}
            onClose={() => setPushSheetOpen(false)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
