import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export type Plan = {
  id: string;
  name: string;
  price_inr: number;
  tokens_included: number;
  max_saved_queries: number;
  max_leads_per_day: number;
  features: string[];
  subscriber_count: number;
  enabled: boolean;
};

type EditForm = {
  price_inr: number;
  tokens_included: number;
  max_saved_queries: number;
  max_leads_per_day: number;
  features: string;
  enabled: boolean;
};

interface PlanCardProps {
  plan: Plan;
}

const PLAN_COLORS: Record<string, string> = {
  Free: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  Starter: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Pro: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  Enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
};

export function PlanCard({ plan }: PlanCardProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm>({
    price_inr: plan.price_inr,
    tokens_included: plan.tokens_included,
    max_saved_queries: plan.max_saved_queries,
    max_leads_per_day: plan.max_leads_per_day,
    features: plan.features.join('\n'),
    enabled: plan.enabled,
  });
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Partial<Plan>) => api.patch(`/admin/plans/${plan.id}`, data),
    onSuccess: () => {
      toast.success('Plan updated');
      qc.invalidateQueries({ queryKey: ['admin-plans'] });
      setEditing(false);
    },
    onError: () => toast.error('Failed to update plan'),
  });

  const handleSave = () => {
    mutation.mutate({
      price_inr: form.price_inr,
      tokens_included: form.tokens_included,
      max_saved_queries: form.max_saved_queries,
      max_leads_per_day: form.max_leads_per_day,
      features: form.features.split('\n').filter(Boolean),
      enabled: form.enabled,
    });
  };

  const colorClass = PLAN_COLORS[plan.name] ?? 'bg-zinc-100 text-zinc-700';

  return (
    <>
      <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4 hover:ring-1 hover:ring-ring/30 transition-all">
        <div className="flex items-start justify-between">
          <div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${colorClass}`}>
              {plan.name}
            </span>
            <div className="mt-2">
              <span className="text-2xl font-bold text-foreground">{formatINR(plan.price_inr)}</span>
              {plan.price_inr > 0 && (
                <span className="text-sm text-muted-foreground ml-1">/mo</span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setEditing(true)}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Tokens / mo</span>
            <span className="font-medium text-foreground">
              {plan.tokens_included.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Saved queries</span>
            <span className="font-medium text-foreground">{plan.max_saved_queries}</span>
          </div>
          <div className="flex justify-between">
            <span>Leads / day</span>
            <span className="font-medium text-foreground">{plan.max_leads_per_day}</span>
          </div>
        </div>

        <ul className="space-y-1">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              {f}
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{plan.subscriber_count.toLocaleString()} subscribers</span>
          </div>
          <Badge variant={plan.enabled ? 'default' : 'secondary'} className="text-xs">
            {plan.enabled ? 'Active' : 'Disabled'}
          </Badge>
        </div>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {plan.name} Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Price (&#8377;/mo)</Label>
                <Input
                  type="number"
                  value={form.price_inr}
                  onChange={(e) => setForm((f) => ({ ...f, price_inr: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tokens / mo</Label>
                <Input
                  type="number"
                  value={form.tokens_included}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tokens_included: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max saved queries</Label>
                <Input
                  type="number"
                  value={form.max_saved_queries}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, max_saved_queries: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max leads / day</Label>
                <Input
                  type="number"
                  value={form.max_leads_per_day}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, max_leads_per_day: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Features (one per line)</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                value={form.features}
                onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Enabled</Label>
              <Switch
                checked={form.enabled}
                onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
