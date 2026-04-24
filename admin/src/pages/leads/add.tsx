import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/common/PageHeader';
import { ScoreBadge } from '@/components/common/ScoreBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  linkedin_url: z
    .string()
    .url('Must be a valid URL')
    .refine((v) => v.includes('linkedin.com'), { message: 'Must be a LinkedIn URL' }),
});
type FormData = z.infer<typeof schema>;

type LeadPreview = {
  id?: string;
  name: string | null;
  headline: string | null;
  company: string | null;
  latest_post_text: string | null;
  score: number;
  icp_type: string | null;
};

type FetchResponse = {
  lead: LeadPreview;
};

export default function AddLeadPage() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<LeadPreview | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const fetchMutation = useMutation({
    mutationFn: (data: FormData) => api.post<FetchResponse>('/leads/manual', data),
    onSuccess: (res) => {
      setPreview(res.lead);
      toast.success('Profile fetched');
    },
    onError: () => toast.error('Failed to fetch profile'),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      api.post('/leads/manual/save', { linkedin_url: getValues('linkedin_url'), commit: true }),
    onSuccess: () => {
      toast.success('Lead saved');
      navigate('/leads');
    },
    onError: () => toast.error('Failed to save lead'),
  });

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 -ml-2"
          onClick={() => navigate('/leads')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <PageHeader
        title="Add Lead Manually"
        subtitle="Enter a LinkedIn URL to fetch and preview the profile"
      />

      <form onSubmit={handleSubmit((data) => fetchMutation.mutate(data))} className="space-y-4">
        <div>
          <Label htmlFor="linkedin_url">LinkedIn Profile URL</Label>
          <div className="flex gap-2 mt-1.5">
            <Input
              id="linkedin_url"
              {...register('linkedin_url')}
              placeholder="https://www.linkedin.com/in/username"
              className="flex-1"
              disabled={fetchMutation.isPending}
            />
            <Button type="submit" disabled={fetchMutation.isPending}>
              {fetchMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Fetch'
              )}
            </Button>
          </div>
          {errors.linkedin_url && (
            <p className="text-sm text-red-500 mt-1">{errors.linkedin_url.message}</p>
          )}
        </div>
      </form>

      {/* Preview section */}
      {preview && (
        <div className="mt-6 rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">{preview.name ?? 'Unknown'}</h2>
              {preview.headline && (
                <p className="text-sm text-muted-foreground mt-0.5">{preview.headline}</p>
              )}
              {preview.company && (
                <p className="text-sm text-muted-foreground">{preview.company}</p>
              )}
            </div>
            <ScoreBadge score={preview.score} className="mt-1" />
          </div>

          {preview.icp_type && (
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                ICP Type
              </span>
              <p className="text-sm font-medium capitalize mt-0.5">{preview.icp_type}</p>
            </div>
          )}

          {preview.latest_post_text && (
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Latest Post
              </span>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-4 whitespace-pre-line">
                {preview.latest_post_text}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              )}
              Save lead
            </Button>
            <Button variant="outline" onClick={() => setPreview(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
