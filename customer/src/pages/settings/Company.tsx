import { useState, useEffect, type KeyboardEvent } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

// --- Types ---
type CompanyData = {
  company_name: string;
  tagline: string;
  website: string;
  description: string;
  ideal_clients: string[];
  industries: string[];
  geography: string[];
  search_phrases: string[];
  budget_signals: string[];
};

// --- Schema ---
const schema = z.object({
  company_name: z.string().min(1, 'Company name required'),
  tagline: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
  ideal_clients: z.array(z.string()),
  industries: z.array(z.string()),
  geography: z.array(z.string()),
  search_phrases: z.array(z.string()),
  budget_signals: z.array(z.string()),
});
type FormValues = z.infer<typeof schema>;

// --- ChipInput ---
type ChipInputProps = { chips: string[]; onChange: (chips: string[]) => void; placeholder?: string };

function ChipInput({ chips, onChange, placeholder }: ChipInputProps) {
  const [draft, setDraft] = useState('');

  const add = (value: string) => {
    const v = value.trim();
    if (!v || chips.includes(v)) return;
    onChange([...chips, v]);
    setDraft('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); add(draft); }
    if (e.key === 'Backspace' && draft === '' && chips.length > 0) onChange(chips.slice(0, -1));
  };

  return (
    <div className="space-y-2">
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800 font-medium">
              {chip}
              <button type="button" onClick={() => onChange(chips.filter((_, j) => j !== i))}
                className="ml-0.5 text-orange-500 hover:text-orange-700 leading-none" aria-label={`Remove ${chip}`}>
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => add(draft)}
        placeholder={placeholder ?? 'Type and press Enter'}
      />
    </div>
  );
}

// --- Textarea without extra dep ---
function TextareaField({ id, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string }) {
  return (
    <textarea
      id={id}
      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
      {...props}
    />
  );
}

export default function Company() {
  const [scrapeDialogOpen, setScrapeDialogOpen] = useState(false);

  const { data, isLoading } = useQuery<CompanyData>({
    queryKey: ['company'],
    queryFn: () => api.get('/users/me/company'),
  });

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      company_name: '', tagline: '', website: '', description: '',
      ideal_clients: [], industries: [], geography: [], search_phrases: [], budget_signals: [],
    },
  });

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => api.patch('/users/me/company', values),
    onSuccess: () => toast.success('Company profile saved'),
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Save failed'),
  });

  const scrapeMutation = useMutation({
    mutationFn: () => api.post('/scrape/re-init'),
    onSuccess: () => { setScrapeDialogOpen(false); toast.success('Re-scrape initiated'); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to start re-scrape'),
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-lg" />;

  const chipFields = [
    { name: 'ideal_clients' as const, label: 'Ideal Clients', placeholder: 'e.g. VP of Sales, Series B startup' },
    { name: 'industries' as const, label: 'Industries', placeholder: 'e.g. Fintech, SaaS, Healthcare' },
    { name: 'geography' as const, label: 'Geography', placeholder: 'e.g. India, UAE, Mumbai' },
    { name: 'search_phrases' as const, label: 'Search Phrases', placeholder: 'e.g. CTO fintech Mumbai' },
    { name: 'budget_signals' as const, label: 'Budget Signals', placeholder: 'e.g. Series A, 50+ employees' },
  ];

  return (
    <div className="space-y-8 max-w-lg">
      <h2 className="text-2xl font-semibold" style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic' }}>
        Company Profile
      </h2>

      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="company_name">Company Name</Label>
          <Input id="company_name" {...register('company_name')} />
          {errors.company_name && <p className="text-xs text-destructive">{errors.company_name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input id="tagline" {...register('tagline')} placeholder="We help SaaS companies close deals faster" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" {...register('website')} placeholder="https://example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <TextareaField id="description" {...register('description')} rows={4}
            placeholder="What do you do, how, and for whom?" />
        </div>

        <Separator />

        {chipFields.map(({ name, label, placeholder }) => (
          <div key={name} className="space-y-2">
            <Label>{label}</Label>
            <Controller name={name} control={control}
              render={({ field }) => (
                <ChipInput chips={field.value as string[]} onChange={field.onChange} placeholder={placeholder} />
              )}
            />
          </div>
        ))}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" onClick={() => setScrapeDialogOpen(true)}>
            Re-trigger scrape
          </Button>
        </div>
      </form>

      <Dialog open={scrapeDialogOpen} onOpenChange={setScrapeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-trigger Initial Scrape</DialogTitle>
            <DialogDescription>
              This will start a fresh scrape using your updated company settings. Existing leads will not be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScrapeDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => scrapeMutation.mutate()} disabled={scrapeMutation.isPending}>
              {scrapeMutation.isPending ? 'Starting…' : 'Start Scrape'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
