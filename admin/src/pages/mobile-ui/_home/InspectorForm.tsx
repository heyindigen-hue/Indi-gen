import { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { WIDGET_CATALOG_MAP } from '@/components/sdui/widgetCatalog';
import type { SchemaField } from '@/components/sdui/widgetCatalog';
import type { WidgetInstance } from '@/types/sdui';

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

const selectClass = cn(
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
);

const textareaClass = cn(
  'flex w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm',
  'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
  'disabled:cursor-not-allowed disabled:opacity-50 resize-none min-h-[80px]',
);

interface SchemaFieldRendererProps {
  field: SchemaField;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
}

function SchemaFieldRenderer({ field, value, onChange }: SchemaFieldRendererProps) {
  if (field.type === 'boolean') {
    return (
      <FieldRow label={field.label}>
        <Switch
          checked={Boolean(value ?? false)}
          onCheckedChange={(v) => onChange(field.key, v)}
        />
      </FieldRow>
    );
  }

  if (field.type === 'select' && field.options) {
    return (
      <FieldRow label={field.label}>
        <select
          className={selectClass}
          value={String(value ?? '')}
          onChange={(e) => onChange(field.key, e.target.value)}
        >
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </FieldRow>
    );
  }

  if (field.type === 'textarea') {
    return (
      <FieldRow label={field.label}>
        <textarea
          className={textareaClass}
          placeholder={field.placeholder}
          value={String(value ?? '')}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      </FieldRow>
    );
  }

  if (field.type === 'json') {
    let display = '';
    try {
      display = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    } catch {
      display = '';
    }
    return (
      <FieldRow label={field.label}>
        <textarea
          className={cn(textareaClass, 'font-mono text-xs min-h-[120px]')}
          placeholder={field.placeholder ?? '[]'}
          value={display}
          onChange={(e) => {
            try {
              onChange(field.key, JSON.parse(e.target.value));
            } catch {
              // keep raw string while user is typing
              onChange(field.key, e.target.value);
            }
          }}
        />
      </FieldRow>
    );
  }

  // text or number
  return (
    <FieldRow label={field.label}>
      <Input
        type={field.type === 'number' ? 'number' : 'text'}
        placeholder={field.placeholder}
        min={field.min}
        max={field.max}
        value={String(value ?? '')}
        onChange={(e) => {
          const v = field.type === 'number' ? Number(e.target.value) : e.target.value;
          onChange(field.key, v);
        }}
      />
    </FieldRow>
  );
}

interface InspectorFormProps {
  widget: WidgetInstance | null;
  onUpdateProps: (id: string, props: Record<string, unknown>) => void;
}

export function InspectorForm({ widget, onUpdateProps }: InspectorFormProps) {
  const handleChange = useCallback(
    (key: string, value: unknown) => {
      if (!widget) return;
      onUpdateProps(widget.id, { ...widget.props, [key]: value });
    },
    [widget, onUpdateProps],
  );

  const handleReset = useCallback(
    (field: SchemaField) => {
      if (!widget) return;
      const entry = WIDGET_CATALOG_MAP[widget.type];
      const defaultValue = entry?.defaultProps[field.key];
      handleChange(field.key, defaultValue);
    },
    [widget, handleChange],
  );

  if (!widget) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center px-4">
        <p className="text-sm text-muted-foreground">No widget selected</p>
        <p className="text-xs text-muted-foreground mt-1">
          Click a widget on the canvas to edit its props
        </p>
      </div>
    );
  }

  const entry = WIDGET_CATALOG_MAP[widget.type];
  const fields = entry?.fields ?? [];

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto max-h-[700px]">
      <div className="border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10"
            style={{ backgroundColor: entry?.colorDot ?? '#94A3B8' }}
          />
          <p className="text-sm font-medium">{entry?.label ?? widget.type}</p>
        </div>
        {entry?.description && (
          <p className="text-xs text-muted-foreground mt-0.5 ml-4">{entry.description}</p>
        )}
        <p className="text-[10px] text-muted-foreground font-mono mt-1 truncate opacity-60">{widget.id}</p>
      </div>

      {fields.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          This widget has no configurable props
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {fields.map((field) => (
            <div key={field.key} className="group relative">
              <SchemaFieldRenderer
                field={field}
                value={widget.props[field.key]}
                onChange={handleChange}
              />
              {entry?.defaultProps[field.key] !== undefined && (
                <button
                  onClick={() => handleReset(field)}
                  className="absolute top-0 right-0 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground"
                  title="Reset to default"
                >
                  reset
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
