import { useState, useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FilterIcon, TrashIcon, PlusIcon } from '@/icons';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DeviceFrame } from '@/components/sdui/DeviceFrame';
import { api } from '@/lib/api';
import type { PaywallBundle } from '@/types/sdui';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaywallCopy {
  headline: string;
  subheadline: string;
  footerText: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_BUNDLES: PaywallBundle[] = [
  { id: '1', tokens: 50,  price_inr: 49,  badge: '',           savings: '',          order: 0 },
  { id: '2', tokens: 200, price_inr: 149, badge: 'Popular',    savings: 'Save 25%',  order: 1 },
  { id: '3', tokens: 500, price_inr: 299, badge: 'Best Value', savings: 'Save 40%',  order: 2 },
];

const DEFAULT_COPY: PaywallCopy = {
  headline:    'Get more leads',
  subheadline: 'Choose a plan that works for you',
  footerText:  'Cancel anytime',
};

// ─── BundleRow ────────────────────────────────────────────────────────────────

interface BundleRowProps {
  bundle: PaywallBundle;
  onChange: (updated: PaywallBundle) => void;
  onDelete: (id: string) => void;
}

function BundleRow({ bundle, onChange, onDelete }: BundleRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: bundle.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const set = <K extends keyof PaywallBundle>(key: K, value: PaywallBundle[K]) =>
    onChange({ ...bundle, [key]: value });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border border-border bg-card p-2"
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        aria-label="Drag to reorder"
        className="shrink-0 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
      >
        <FilterIcon size={16} />
      </button>

      <div className="flex flex-1 flex-wrap gap-2">
        <div className="flex flex-col gap-1 min-w-[80px]">
          <Label className="text-[10px] text-muted-foreground">Tokens</Label>
          <Input
            type="number"
            min={1}
            value={bundle.tokens}
            onChange={(e) => set('tokens', Number(e.target.value))}
            className="h-7 text-xs w-full"
          />
        </div>

        <div className="flex flex-col gap-1 min-w-[90px]">
          <Label className="text-[10px] text-muted-foreground">Price (₹)</Label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none">
              ₹
            </span>
            <Input
              type="number"
              min={0}
              value={bundle.price_inr}
              onChange={(e) => set('price_inr', Number(e.target.value))}
              className="h-7 text-xs pl-5 w-full"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1 min-w-[100px]">
          <Label className="text-[10px] text-muted-foreground">Badge</Label>
          <Input
            value={bundle.badge}
            placeholder="e.g. Popular"
            onChange={(e) => set('badge', e.target.value)}
            className="h-7 text-xs w-full"
          />
        </div>

        <div className="flex flex-col gap-1 min-w-[100px]">
          <Label className="text-[10px] text-muted-foreground">Savings</Label>
          <Input
            value={bundle.savings}
            placeholder="e.g. Save 30%"
            onChange={(e) => set('savings', e.target.value)}
            className="h-7 text-xs w-full"
          />
        </div>
      </div>

      <button
        type="button"
        aria-label="Delete bundle"
        onClick={() => onDelete(bundle.id)}
        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
      >
        <TrashIcon size={16} />
      </button>
    </div>
  );
}

// ─── PaywallPreview ───────────────────────────────────────────────────────────

interface PaywallPreviewProps {
  copy: PaywallCopy;
  bundles: PaywallBundle[];
}

function PaywallPreview({ copy, bundles }: PaywallPreviewProps) {
  return (
    <div className="h-full overflow-y-auto bg-white flex flex-col px-4 py-6 gap-4">
      {/* Header copy */}
      <div className="text-center">
        <p className="text-base font-bold text-gray-900 leading-tight">
          {copy.headline || 'Headline'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {copy.subheadline || 'Subheadline'}
        </p>
      </div>

      {/* Bundle cards */}
      <div className="flex flex-col gap-2">
        {bundles.map((bundle) => (
          <PreviewBundleCard key={bundle.id} bundle={bundle} />
        ))}
      </div>

      {/* Footer */}
      {copy.footerText && (
        <p className="text-center text-[10px] text-gray-400 mt-auto pt-2">
          {copy.footerText}
        </p>
      )}
    </div>
  );
}

function PreviewBundleCard({ bundle }: { bundle: PaywallBundle }) {
  const isHighlighted = bundle.badge === 'Popular' || bundle.badge === 'Best Value';

  return (
    <div
      className={`relative rounded-xl border-2 px-3 py-2.5 flex items-center justify-between gap-2 ${
        isHighlighted
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      {bundle.badge && (
        <span className="absolute -top-2 left-3 text-[9px] font-semibold bg-indigo-500 text-white px-1.5 py-0.5 rounded-full">
          {bundle.badge}
        </span>
      )}
      <div>
        <p className="text-sm font-bold text-gray-900">{bundle.tokens} tokens</p>
        {bundle.savings && (
          <p className="text-[10px] text-indigo-600 font-medium">{bundle.savings}</p>
        )}
      </div>
      <p className="text-sm font-semibold text-gray-800 shrink-0">
        ₹{bundle.price_inr}
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PaywallPage() {
  const queryClient = useQueryClient();
  const [copy, setCopy] = useState<PaywallCopy>(DEFAULT_COPY);
  const [bundles, setBundles] = useState<PaywallBundle[]>(DEFAULT_BUNDLES);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const saveMutation = useMutation({
    mutationFn: () =>
      api.post('/admin/manifests', {
        platform: 'mobile',
        enabled: false,
        screens: {
          paywall: {
            headline:    copy.headline,
            subheadline: copy.subheadline,
            bundles:     bundles.map((b, i) => ({ ...b, order: i })),
            footerText:  copy.footerText,
          },
        },
      }),
    onSuccess: () => {
      toast.success('Paywall saved');
      queryClient.invalidateQueries({ queryKey: ['manifests'] });
    },
    onError: () => toast.error('Failed to save paywall'),
  });

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setBundles((prev) => {
      const oldIdx = prev.findIndex((b) => b.id === active.id);
      const newIdx = prev.findIndex((b) => b.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return prev;
      return arrayMove(prev, oldIdx, newIdx);
    });
  }, []);

  const handleBundleChange = useCallback((updated: PaywallBundle) => {
    setBundles((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }, []);

  const handleBundleDelete = useCallback((id: string) => {
    setBundles((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const handleAddBundle = useCallback(() => {
    setBundles((prev) => [
      ...prev,
      {
        id:        crypto.randomUUID(),
        tokens:    100,
        price_inr: 99,
        badge:     '',
        savings:   '',
        order:     prev.length,
      },
    ]);
  }, []);

  return (
    <div className="flex gap-8 items-start">
      {/* ── Editor column ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">

        {/* Paywall copy */}
        <section className="rounded-lg border border-border bg-card">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Paywall Copy
            </p>
          </div>
          <div className="p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                value={copy.headline}
                placeholder="e.g. Get more leads"
                onChange={(e) => setCopy((prev) => ({ ...prev, headline: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="subheadline">Subheadline</Label>
              <Input
                id="subheadline"
                value={copy.subheadline}
                placeholder="e.g. Choose a plan that works for you"
                onChange={(e) => setCopy((prev) => ({ ...prev, subheadline: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="footerText">Footer text</Label>
              <Input
                id="footerText"
                value={copy.footerText}
                placeholder="e.g. Cancel anytime"
                onChange={(e) => setCopy((prev) => ({ ...prev, footerText: e.target.value }))}
              />
            </div>
          </div>
        </section>

        {/* Bundles */}
        <section className="rounded-lg border border-border bg-card">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Bundles
            </p>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={handleAddBundle}>
              <PlusIcon size={14} />
              Add Bundle
            </Button>
          </div>

          <div className="p-4">
            {bundles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No bundles yet. Click "Add Bundle" to create one.
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={bundles.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-2">
                    {bundles.map((bundle) => (
                      <BundleRow
                        key={bundle.id}
                        bundle={bundle}
                        onChange={handleBundleChange}
                        onDelete={handleBundleDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </section>

        {/* Save */}
        <div className="flex justify-end">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="min-w-[120px]"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* ── Preview column ── */}
      <div className="w-[400px] shrink-0 sticky top-6 flex flex-col items-center gap-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide self-start">
          Preview
        </p>
        <DeviceFrame device="iphone">
          <PaywallPreview copy={copy} bundles={bundles} />
        </DeviceFrame>
      </div>
    </div>
  );
}
