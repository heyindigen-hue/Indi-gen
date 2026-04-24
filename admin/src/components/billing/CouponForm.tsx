import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export type Coupon = {
  code: string;
  description: string;
  discount_type: 'percent' | 'flat' | 'tokens';
  value: number;
  max_redemptions: number | null;
  redemptions: number;
  expires_at: string | null;
  enabled: boolean;
};

type CouponFormData = {
  code: string;
  description: string;
  discount_type: 'percent' | 'flat' | 'tokens';
  value: number;
  max_redemptions: string;
  expires_at: string;
  enabled: boolean;
};

const DEFAULT_FORM: CouponFormData = {
  code: '',
  description: '',
  discount_type: 'percent',
  value: 10,
  max_redemptions: '',
  expires_at: '',
  enabled: true,
};

interface CouponFormProps {
  coupon?: Coupon | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<Coupon>) => void;
  isPending?: boolean;
}

export function CouponForm({ coupon, open, onOpenChange, onSave, isPending }: CouponFormProps) {
  const [form, setForm] = useState<CouponFormData>(DEFAULT_FORM);

  useEffect(() => {
    if (open) {
      if (coupon) {
        setForm({
          code: coupon.code,
          description: coupon.description,
          discount_type: coupon.discount_type,
          value: coupon.value,
          max_redemptions:
            coupon.max_redemptions != null ? String(coupon.max_redemptions) : '',
          expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : '',
          enabled: coupon.enabled,
        });
      } else {
        setForm(DEFAULT_FORM);
      }
    }
  }, [coupon, open]);

  const handleSave = () => {
    onSave({
      code: form.code.toUpperCase().trim(),
      description: form.description,
      discount_type: form.discount_type,
      value: form.value,
      max_redemptions: form.max_redemptions ? Number(form.max_redemptions) : null,
      expires_at: form.expires_at || null,
      enabled: form.enabled,
    });
  };

  const isEdit = !!coupon;
  const valueLabel =
    form.discount_type === 'percent' ? '%' : form.discount_type === 'flat' ? '&#8377;' : 'tokens';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${coupon?.code}` : 'Create Coupon'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Code</Label>
            <Input
              placeholder="SUMMER20"
              value={form.code}
              onChange={(e) =>
                setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
              }
              disabled={isEdit}
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input
              placeholder="Summer 2024 promo"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Discount type</Label>
              <Select
                value={form.discount_type}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    discount_type: v as CouponFormData['discount_type'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percent (%)</SelectItem>
                  <SelectItem value="flat">Flat (&#8377;)</SelectItem>
                  <SelectItem value="tokens">Tokens</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>
                Value{' '}
                <span
                  className="text-muted-foreground text-xs"
                  dangerouslySetInnerHTML={{ __html: `(${valueLabel})` }}
                />
              </Label>
              <Input
                type="number"
                min={0}
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Max redemptions</Label>
              <Input
                type="number"
                placeholder="Unlimited"
                value={form.max_redemptions}
                onChange={(e) => setForm((f) => ({ ...f, max_redemptions: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Expires at</Label>
              <Input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
              />
            </div>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || !form.code.trim() || !form.description.trim()}
          >
            {isPending ? 'Saving...' : isEdit ? 'Update Coupon' : 'Create Coupon'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
