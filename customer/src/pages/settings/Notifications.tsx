import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

// --- Types ---
type NotifPrefs = {
  email_lead_found: boolean;
  email_reply: boolean;
  email_scrape_complete: boolean;
  email_low_tokens: boolean;
  push_lead_found: boolean;
  push_reply: boolean;
  push_scrape_complete: boolean;
  push_low_tokens: boolean;
  whatsapp_opt_in: boolean;
};

type PrefKey = keyof NotifPrefs;

// --- Config for rendering ---
const EMAIL_PREFS: { key: PrefKey; label: string; description: string }[] = [
  { key: 'email_lead_found', label: 'New Lead Found', description: 'Email when a new lead is discovered for you' },
  { key: 'email_reply', label: 'Reply Received', description: 'Email when a prospect replies to outreach' },
  { key: 'email_scrape_complete', label: 'Scrape Complete', description: 'Email when a scrape job finishes' },
  { key: 'email_low_tokens', label: 'Low Token Balance', description: 'Email when your token balance drops below 50' },
];

const PUSH_PREFS: { key: PrefKey; label: string; description: string }[] = [
  { key: 'push_lead_found', label: 'New Lead Found', description: 'Push notification for new leads' },
  { key: 'push_reply', label: 'Reply Received', description: 'Push notification when a prospect replies' },
  { key: 'push_scrape_complete', label: 'Scrape Complete', description: 'Push notification when scrape finishes' },
  { key: 'push_low_tokens', label: 'Low Token Balance', description: 'Push notification for low token balance' },
];

// --- Toggle row ---
function PrefRow({
  label, description, checked, onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// --- Section heading ---
function SectionTitle({ children }: { children: string }) {
  return <h3 className="text-sm font-semibold text-foreground mb-1">{children}</h3>;
}

export default function Notifications() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<NotifPrefs>({
    queryKey: ['notif-prefs'],
    queryFn: () => api.get('/users/me/notifications'),
  });

  const mutation = useMutation({
    mutationFn: (patch: Partial<NotifPrefs>) => api.patch('/users/me/notifications', patch),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: ['notif-prefs'] });
      const prev = qc.getQueryData<NotifPrefs>(['notif-prefs']);
      qc.setQueryData<NotifPrefs>(['notif-prefs'], (old) => old ? { ...old, ...patch } : old);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['notif-prefs'], ctx.prev);
      toast.error('Failed to update preference');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notif-prefs'] }),
  });

  const toggle = (key: PrefKey, value: boolean) => mutation.mutate({ [key]: value });

  if (isLoading || !data) {
    return (
      <div className="space-y-4 max-w-lg">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-lg">
      <h2 className="text-2xl font-semibold" style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic' }}>
        Notifications
      </h2>

      <div>
        <SectionTitle>Email Notifications</SectionTitle>
        <div className="divide-y divide-border">
          {EMAIL_PREFS.map((p) => (
            <PrefRow key={p.key} label={p.label} description={p.description}
              checked={data[p.key]} onChange={(v) => toggle(p.key, v)} />
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <SectionTitle>Push Notifications</SectionTitle>
        <div className="divide-y divide-border">
          {PUSH_PREFS.map((p) => (
            <PrefRow key={p.key} label={p.label} description={p.description}
              checked={data[p.key]} onChange={(v) => toggle(p.key, v)} />
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <SectionTitle>WhatsApp</SectionTitle>
        <div className="divide-y divide-border">
          <PrefRow
            label="WhatsApp Notifications"
            description="Receive important alerts and updates on WhatsApp"
            checked={data.whatsapp_opt_in}
            onChange={(v) => toggle('whatsapp_opt_in', v)}
          />
        </div>
      </div>
    </div>
  );
}
