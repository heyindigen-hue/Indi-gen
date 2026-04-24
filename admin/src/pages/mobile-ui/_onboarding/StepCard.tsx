import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FilterIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon } from '@/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { OnboardingStep } from '@/types/sdui';

interface StepCardProps {
  step: OnboardingStep;
  index: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  onUpdate: (updated: OnboardingStep) => void;
}

type StepFormValues = {
  title: string;
  body: string;
  illustrationUrl: string;
  inputType: OnboardingStep['inputType'];
  optionsRaw: string;
  validationRegex: string;
  animated: boolean;
};

const INPUT_TYPES: OnboardingStep['inputType'][] = ['none', 'chip', 'text', 'select', 'skip'];

function textareaClass(extra?: string) {
  return cn(
    'flex w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm',
    'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
    'disabled:cursor-not-allowed disabled:opacity-50 resize-none',
    extra,
  );
}

function selectClass() {
  return cn(
    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function StepCard({ step, index, expanded, onToggleExpand, onDelete, onUpdate }: StepCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const { register, watch, setValue } = useForm<StepFormValues>({
    defaultValues: {
      title: step.title,
      body: step.body,
      illustrationUrl: step.illustrationUrl,
      inputType: step.inputType,
      optionsRaw: step.options.join(', '),
      validationRegex: step.validationRegex,
      animated: step.animated,
    },
  });

  useEffect(() => {
    const sub = watch((values) => {
      const options = (values.optionsRaw ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      onUpdate({
        ...step,
        title: values.title ?? '',
        body: values.body ?? '',
        illustrationUrl: values.illustrationUrl ?? '',
        inputType: (values.inputType ?? 'none') as OnboardingStep['inputType'],
        options,
        validationRegex: values.validationRegex ?? '',
        animated: values.animated ?? true,
      });
    });
    return () => sub.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]);

  const inputType = watch('inputType');
  const animated = watch('animated');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground transition-colors"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <FilterIcon size={16} />
        </button>

        <button
          type="button"
          className="flex items-center gap-2 flex-1 text-left min-w-0"
          onClick={onToggleExpand}
        >
          {expanded
            ? <ChevronDownIcon size={14} className="text-muted-foreground shrink-0" />
            : <ChevronRightIcon size={14} className="text-muted-foreground shrink-0" />
          }
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0">
            Step {index + 1}
          </span>
          <span className="text-sm text-foreground truncate">{watch('title') || 'Untitled'}</span>
        </button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label="Delete step"
        >
          <TrashIcon size={14} />
        </Button>
      </div>

      {/* Body */}
      {expanded && (
        <div className="p-4 grid grid-cols-2 gap-4">
          <FieldRow label="Title">
            <Input {...register('title')} placeholder="Step title" />
          </FieldRow>

          <FieldRow label="Input Type">
            <select className={selectClass()} {...register('inputType')}>
              {INPUT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </FieldRow>

          <div className="col-span-2">
            <FieldRow label="Body">
              <textarea
                className={textareaClass('min-h-[72px]')}
                placeholder="Description shown to the user"
                {...register('body')}
              />
            </FieldRow>
          </div>

          <div className="col-span-2">
            <FieldRow label="Illustration URL">
              <Input {...register('illustrationUrl')} placeholder="https://..." />
            </FieldRow>
          </div>

          {inputType === 'select' && (
            <div className="col-span-2">
              <FieldRow label="Options (comma-separated)">
                <textarea
                  className={textareaClass('min-h-[60px]')}
                  placeholder="Option A, Option B, Option C"
                  {...register('optionsRaw')}
                />
              </FieldRow>
            </div>
          )}

          <FieldRow label="Validation Regex">
            <Input {...register('validationRegex')} placeholder="e.g. ^[a-z]+$" />
          </FieldRow>

          <FieldRow label="Animated">
            <div className="flex items-center h-9">
              <Switch
                checked={animated}
                onCheckedChange={(v) => setValue('animated', v, { shouldDirty: true })}
              />
            </div>
          </FieldRow>
        </div>
      )}
    </div>
  );
}
