import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { WidgetInstance, WidgetType } from '@/types/sdui';

// --- Zod schemas per widget type ---

const tokenBalanceSchema = z.object({
  initialValue: z.coerce.number().default(0),
});

const announcementBannerSchema = z.object({
  message: z.string().default(''),
  dismissable: z.boolean().default(false),
});

const quickFiltersSchema = z.object({
  filtersRaw: z.string().default(''),
});

const leadSwipeStackSchema = z.object({
  maxCards: z.coerce.number().default(5),
  showScore: z.boolean().default(false),
});

const recentLeadsCarouselSchema = z.object({
  limit: z.coerce.number().default(10),
});

const actionButtonsSchema = z.object({
  buttonsRaw: z.string().default(''),
});

const metricCardSchema = z.object({
  label: z.string().default(''),
  value: z.string().default(''),
  trend: z.enum(['up', 'down', 'flat']).default('flat'),
});

const customHtmlSchema = z.object({
  html: z.string().default(''),
});

const dividerSchema = z.object({
  thickness: z.coerce.number().default(1),
});

const spacerSchema = z.object({
  height: z.coerce.number().default(16),
});

type TokenBalanceValues = z.infer<typeof tokenBalanceSchema>;
type AnnouncementBannerValues = z.infer<typeof announcementBannerSchema>;
type QuickFiltersValues = z.infer<typeof quickFiltersSchema>;
type LeadSwipeStackValues = z.infer<typeof leadSwipeStackSchema>;
type RecentLeadsCarouselValues = z.infer<typeof recentLeadsCarouselSchema>;
type ActionButtonsValues = z.infer<typeof actionButtonsSchema>;
type MetricCardValues = z.infer<typeof metricCardSchema>;
type CustomHtmlValues = z.infer<typeof customHtmlSchema>;
type DividerValues = z.infer<typeof dividerSchema>;
type SpacerValues = z.infer<typeof spacerSchema>;

// --- Helpers ---

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function textareaClass(className?: string) {
  return cn(
    'flex w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm',
    'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
    'disabled:cursor-not-allowed disabled:opacity-50 resize-none',
    className,
  );
}

// --- Per-type form components ---

function TokenBalanceForm({
  widget,
  onUpdate,
}: {
  widget: WidgetInstance;
  onUpdate: (props: Record<string, unknown>) => void;
}) {
  const defaults: TokenBalanceValues = {
    initialValue: Number(widget.props.initialValue ?? 0),
  };
  const { register, watch } = useForm<TokenBalanceValues>({
    resolver: zodResolver(tokenBalanceSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    const sub = watch((values) => onUpdate({ initialValue: values.initialValue }));
    return () => sub.unsubscribe();
  }, [watch, onUpdate]);

  return (
    <FieldRow label="Initial Value">
      <Input type="number" {...register('initialValue')} />
    </FieldRow>
  );
}

function AnnouncementBannerForm({
  widget,
  onUpdate,
}: {
  widget: WidgetInstance;
  onUpdate: (props: Record<string, unknown>) => void;
}) {
  const defaults: AnnouncementBannerValues = {
    message: String(widget.props.message ?? ''),
    dismissable: Boolean(widget.props.dismissable ?? false),
  };
  const { register, watch, setValue } = useForm<AnnouncementBannerValues>({
    resolver: zodResolver(announcementBannerSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    const sub = watch((values) => onUpdate({ message: values.message, dismissable: values.dismissable }));
    return () => sub.unsubscribe();
  }, [watch, onUpdate]);

  const dismissable = watch('dismissable');

  return (
    <>
      <FieldRow label="Message">
        <Input {...register('message')} placeholder="Announcement text" />
      </FieldRow>
      <FieldRow label="Dismissable">
        <Switch
          checked={dismissable}
          onCheckedChange={(v) => setValue('dismissable', v, { shouldDirty: true })}
        />
      </FieldRow>
    </>
  );
}

function QuickFiltersForm({
  widget,
  onUpdate,
}: {
  widget: WidgetInstance;
  onUpdate: (props: Record<string, unknown>) => void;
}) {
  const existingFilters = Array.isArray(widget.props.filters)
    ? (widget.props.filters as string[]).join(', ')
    : '';
  const { register, watch } = useForm<QuickFiltersValues>({
    resolver: zodResolver(quickFiltersSchema),
    defaultValues: { filtersRaw: existingFilters },
  });

  useEffect(() => {
    const sub = watch((values) => {
      const filters = (values.filtersRaw ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      onUpdate({ filters });
    });
    return () => sub.unsubscribe();
  }, [watch, onUpdate]);

  return (
    <FieldRow label="Filters (comma-separated)">
      <textarea
        className={textareaClass('min-h-[72px]')}
        placeholder="e.g. New, Hot, Nearby"
        {...register('filtersRaw')}
      />
    </FieldRow>
  );
}

function LeadSwipeStackForm({
  widget,
  onUpdate,
}: {
  widget: WidgetInstance;
  onUpdate: (props: Record<string, unknown>) => void;
}) {
  const defaults: LeadSwipeStackValues = {
    maxCards: Number(widget.props.maxCards ?? 5),
    showScore: Boolean(widget.props.showScore ?? false),
  };
  const { register, watch, setValue } = useForm<LeadSwipeStackValues>({
    resolver: zodResolver(leadSwipeStackSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    const sub = watch((values) => onUpdate({ maxCards: values.maxCards, showScore: values.showScore }));
    return () => sub.unsubscribe();
  }, [watch, onUpdate]);

  const showScore = watch('showScore');

  return (
    <>
      <FieldRow label="Max Cards">
        <Input type="number" {...register('maxCards')} />
      </FieldRow>
      <FieldRow label="Show Score">
        <Switch
          checked={showScore}
          onCheckedChange={(v) => setValue('showScore', v, { shouldDirty: true })}
        />
      </FieldRow>
    </>
  );
}

function RecentLeadsCarouselForm({
  widget,
  onUpdate,
}: {
  widget: WidgetInstance;
  onUpdate: (props: Record<string, unknown>) => void;
}) {
  const { register, watch } = useForm<RecentLeadsCarouselValues>({
    resolver: zodResolver(recentLeadsCarouselSchema),
    defaultValues: { limit: Number(widget.props.limit ?? 10) },
  });

  useEffect(() => {
    const sub = watch((values) => onUpdate({ limit: values.limit }));
    return () => sub.unsubscribe();
  }, [watch, onUpdate]);

  return (
    <FieldRow label="Limit">
      <Input type="number" {...register('limit')} />
    </FieldRow>
  );
}

function ActionButtonsForm({
  widget,
  onUpdate,
}: {
  widget: WidgetInstance;
  onUpdate: (props: Record<string, unknown>) => void;
}) {
  const existingButtons = Array.isArray(widget.props.buttons)
    ? (widget.props.buttons as string[]).join(', ')
    : '';
  const { register, watch } = useForm<ActionButtonsValues>({
    resolver: zodResolver(actionButtonsSchema),
    defaultValues: { buttonsRaw: existingButtons },
  });

  useEffect(() => {
    const sub = watch((values) => {
      const buttons = (values.buttonsRaw ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      onUpdate({ buttons });
    });
    return () => sub.unsubscribe();
  }, [watch, onUpdate]);

  return (
    <FieldRow label="Buttons (comma-separated)">
      <textarea
        className={textareaClass('min-h-[72px]')}
        placeholder="e.g. Apply, Reject, Skip"
        {...register('buttonsRaw')}
      />
    </FieldRow>
  );
}

function MetricCardForm({
  widget,
  onUpdate,
}: {
  widget: WidgetInstance;
  onUpdate: (props: Record<string, unknown>) => void;
}) {
  const defaults: MetricCardValues = {
    label: String(widget.props.label ?? ''),
    value: String(widget.props.value ?? ''),
    trend: (widget.props.trend as 'up' | 'down' | 'flat') ?? 'flat',
  };
  const { register, watch } = useForm<MetricCardValues>({
    resolver: zodResolver(metricCardSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    const sub = watch((values) =>
      onUpdate({ label: values.label, value: values.value, trend: values.trend }),
    );
    return () => sub.unsubscribe();
  }, [watch, onUpdate]);

  return (
    <>
      <FieldRow label="Label">
        <Input {...register('label')} placeholder="e.g. Total Leads" />
      </FieldRow>
      <FieldRow label="Value">
        <Input {...register('value')} placeholder="e.g. 124" />
      </FieldRow>
      <FieldRow label="Trend">
        <select
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          )}
          {...register('trend')}
        >
          <option value="flat">Flat</option>
          <option value="up">Up</option>
          <option value="down">Down</option>
        </select>
      </FieldRow>
    </>
  );
}

function CustomHtmlForm({
  widget,
  onUpdate,
}: {
  widget: WidgetInstance;
  onUpdate: (props: Record<string, unknown>) => void;
}) {
  const { register, watch } = useForm<CustomHtmlValues>({
    resolver: zodResolver(customHtmlSchema),
    defaultValues: { html: String(widget.props.html ?? '') },
  });

  useEffect(() => {
    const sub = watch((values) => onUpdate({ html: values.html }));
    return () => sub.unsubscribe();
  }, [watch, onUpdate]);

  return (
    <FieldRow label="HTML">
      <textarea
        className={textareaClass('min-h-[120px] font-mono text-xs')}
        placeholder="<div>...</div>"
        {...register('html')}
      />
    </FieldRow>
  );
}

function DividerForm({
  widget,
  onUpdate,
}: {
  widget: WidgetInstance;
  onUpdate: (props: Record<string, unknown>) => void;
}) {
  const { register, watch } = useForm<DividerValues>({
    resolver: zodResolver(dividerSchema),
    defaultValues: { thickness: Number(widget.props.thickness ?? 1) },
  });

  useEffect(() => {
    const sub = watch((values) => onUpdate({ thickness: values.thickness }));
    return () => sub.unsubscribe();
  }, [watch, onUpdate]);

  return (
    <FieldRow label="Thickness (px)">
      <Input type="number" {...register('thickness')} min={1} max={8} />
    </FieldRow>
  );
}

function SpacerForm({
  widget,
  onUpdate,
}: {
  widget: WidgetInstance;
  onUpdate: (props: Record<string, unknown>) => void;
}) {
  const { register, watch } = useForm<SpacerValues>({
    resolver: zodResolver(spacerSchema),
    defaultValues: { height: Number(widget.props.height ?? 16) },
  });

  useEffect(() => {
    const sub = watch((values) => onUpdate({ height: values.height }));
    return () => sub.unsubscribe();
  }, [watch, onUpdate]);

  return (
    <FieldRow label="Height (px)">
      <Input type="number" {...register('height')} min={4} max={200} />
    </FieldRow>
  );
}

// --- Dispatch map ---

const FORM_MAP: Record<
  WidgetType,
  (props: { widget: WidgetInstance; onUpdate: (p: Record<string, unknown>) => void }) => React.ReactElement
> = {
  TokenBalance:        (p) => <TokenBalanceForm {...p} />,
  AnnouncementBanner:  (p) => <AnnouncementBannerForm {...p} />,
  QuickFilters:        (p) => <QuickFiltersForm {...p} />,
  LeadSwipeStack:      (p) => <LeadSwipeStackForm {...p} />,
  RecentLeadsCarousel: (p) => <RecentLeadsCarouselForm {...p} />,
  ActionButtons:       (p) => <ActionButtonsForm {...p} />,
  MetricCard:          (p) => <MetricCardForm {...p} />,
  CustomHtml:          (p) => <CustomHtmlForm {...p} />,
  Divider:             (p) => <DividerForm {...p} />,
  Spacer:              (p) => <SpacerForm {...p} />,
};

// --- Public component ---

interface InspectorFormProps {
  widget: WidgetInstance | null;
  onUpdateProps: (id: string, props: Record<string, unknown>) => void;
}

export function InspectorForm({ widget, onUpdateProps }: InspectorFormProps) {
  if (!widget) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center px-4">
        <p className="text-sm text-muted-foreground">No widget selected</p>
        <p className="text-xs text-muted-foreground mt-1">Click a widget on the canvas to edit its props</p>
      </div>
    );
  }

  const FormComponent = FORM_MAP[widget.type];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="border-b border-border pb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Widget</p>
        <p className="text-sm font-medium mt-0.5">{widget.type}</p>
        <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">{widget.id}</p>
      </div>
      <div className="flex flex-col gap-4">
        <FormComponent
          widget={widget}
          onUpdate={(props) => onUpdateProps(widget.id, props)}
        />
      </div>
    </div>
  );
}
