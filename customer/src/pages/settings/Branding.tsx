import { useRef, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { UploadIcon } from '@/icons';

// --- Types ---
type BrandingData = { logo_url: string | null; accent_color: string; from_name: string; from_email: string };

const PRO_PLANS = ['pro', 'enterprise'];

// --- Schema ---
const schema = z.object({
  accent_color: z.string().min(4, 'Pick a color'),
  from_name: z.string().min(1, 'From name required'),
  from_email: z.string().email('Invalid email'),
});
type FormValues = z.infer<typeof schema>;

// --- Upgrade prompt ---
function UpgradePrompt() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center max-w-sm mx-auto">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-xl">✦</span>
      </div>
      <h3 className="font-semibold text-lg" style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic' }}>
        Pro+ feature
      </h3>
      <p className="text-sm text-muted-foreground">
        White-label branding is available on the Pro and Enterprise plans.
        Upgrade to customise your logo, accent colour, and email sender identity.
      </p>
      <Button style={{ backgroundColor: '#f97316' }} className="text-white hover:opacity-90">
        Upgrade to Pro
      </Button>
    </div>
  );
}

export default function Branding() {
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const isPro = PRO_PLANS.includes(user?.plan ?? '');

  const { data, isLoading } = useQuery<BrandingData>({
    queryKey: ['branding'],
    queryFn: () => api.get('/users/me/branding'),
    enabled: isPro,
  });

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { accent_color: '#f97316', from_name: '', from_email: '' },
  });

  useEffect(() => {
    if (data) {
      reset({ accent_color: data.accent_color || '#f97316', from_name: data.from_name, from_email: data.from_email });
      if (data.logo_url) setLogoPreview(data.logo_url);
    }
  }, [data, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => api.patch('/users/me/branding', values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branding'] }); toast.success('Branding saved'); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Save failed'),
  });

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setLogoPreview(preview);
    const formData = new FormData();
    formData.append('logo', file);
    setUploading(true);
    try {
      await apiFetch('/users/me/branding/logo', { method: 'POST', body: formData, headers: {} });
      qc.invalidateQueries({ queryKey: ['branding'] });
      toast.success('Logo uploaded');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const accentColor = watch('accent_color');

  if (!isPro) return <UpgradePrompt />;
  if (isLoading) return <Skeleton className="h-64 w-full rounded-lg" />;

  return (
    <div className="space-y-8 max-w-lg">
      <h2 className="text-2xl font-semibold" style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic' }}>
        Branding
      </h2>

      {/* Logo */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Logo</h3>
        <div className="flex items-center gap-4">
          {logoPreview ? (
            <img src={logoPreview} alt="Logo preview"
              className="h-14 w-14 rounded-lg object-contain border border-border bg-muted" />
          ) : (
            <div className="h-14 w-14 rounded-lg bg-muted border border-border flex items-center justify-center">
              <UploadIcon size={20} className="text-muted-foreground" />
            </div>
          )}
          <div>
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Upload logo'}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">PNG, SVG or JPG — max 2 MB</p>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
      </div>

      <Separator />

      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-5">
        {/* Accent color */}
        <div className="space-y-2">
          <Label htmlFor="accent_color">Accent Color</Label>
          <div className="flex items-center gap-3">
            <input id="accent_color" type="color" {...register('accent_color')}
              className="h-9 w-14 rounded-md border border-input cursor-pointer p-0.5 bg-background" />
            <div className="h-9 w-9 rounded-md border border-border" style={{ backgroundColor: accentColor }} />
            <span className="text-sm font-mono text-muted-foreground">{accentColor}</span>
          </div>
          {errors.accent_color && <p className="text-xs text-destructive">{errors.accent_color.message}</p>}
        </div>

        {/* From identity */}
        <div className="space-y-2">
          <Label htmlFor="from_name">From Name</Label>
          <Input id="from_name" {...register('from_name')} placeholder="Acme Corp" />
          {errors.from_name && <p className="text-xs text-destructive">{errors.from_name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="from_email">From Email</Label>
          <Input id="from_email" type="email" {...register('from_email')} placeholder="noreply@acme.com" />
          {errors.from_email && <p className="text-xs text-destructive">{errors.from_email.message}</p>}
        </div>

        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving…' : 'Save Branding'}
        </Button>
      </form>

      <Separator />

      {/* White-label preview placeholder */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">White-label Preview</h3>
        <div className="rounded-lg bg-muted h-48 flex items-center justify-center border border-border">
          <p className="text-sm text-muted-foreground">Preview coming soon</p>
        </div>
      </div>
    </div>
  );
}
