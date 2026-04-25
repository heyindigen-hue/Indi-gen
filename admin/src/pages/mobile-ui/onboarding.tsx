import { useState, useCallback, useEffect } from 'react';
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
} from '@dnd-kit/sortable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PlusIcon, CheckIcon } from '@/icons';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useManifest } from '@/hooks/useManifest';
import type { OnboardingStep } from '@/types/sdui';
import { StepCard } from './_onboarding/StepCard';

function createStep(order: number): OnboardingStep {
  return {
    id: crypto.randomUUID(),
    title: 'New Step',
    body: '',
    illustrationUrl: '',
    inputType: 'none',
    options: [],
    validationRegex: '',
    animated: true,
    order,
  };
}

function normaliseOrders(steps: OnboardingStep[]): OnboardingStep[] {
  return steps.map((s, i) => ({ ...s, order: i }));
}

export default function MobileUiOnboardingPage() {
  const queryClient = useQueryClient();
  const { draft, active, isLoading } = useManifest();
  const manifest = draft ?? active;

  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [initialised, setInitialised] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (initialised || isLoading) return;
    const loaded = (manifest?.screens?.onboarding?.onboarding ?? []) as OnboardingStep[];
    if (loaded.length > 0) {
      setSteps(loaded);
      setExpandedIds(new Set([loaded[0].id]));
    } else {
      const first = createStep(0);
      setSteps([first]);
      setExpandedIds(new Set([first.id]));
    }
    setInitialised(true);
  }, [manifest, isLoading, initialised]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const saveMutation = useMutation({
    mutationFn: () =>
      api.post('/admin/manifests', {
        platform: 'mobile',
        enabled: false,
        screens: { onboarding: { onboarding: normaliseOrders(steps) } },
      }),
    onSuccess: () => {
      toast.success('Onboarding steps saved');
      queryClient.invalidateQueries({ queryKey: ['manifests'] });
    },
    onError: () => toast.error('Failed to save onboarding steps'),
  });

  const handleAddStep = useCallback(() => {
    const newStep = createStep(steps.length);
    setSteps((prev) => [...prev, newStep]);
    setExpandedIds((prev) => new Set(prev).add(newStep.id));
  }, [steps.length]);

  const handleDelete = useCallback((id: string) => {
    setSteps((prev) => normaliseOrders(prev.filter((s) => s.id !== id)));
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleUpdate = useCallback((updated: OnboardingStep) => {
    setSteps((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSteps((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return normaliseOrders(arrayMove(prev, oldIndex, newIndex));
    });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Onboarding Steps</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {steps.length} step{steps.length !== 1 ? 's' : ''} — drag to reorder
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleAddStep}
          >
            <PlusIcon size={14} />
            Add Step
          </Button>
          <Button
            type="button"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            <CheckIcon size={14} />
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Step list */}
      {steps.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 rounded-lg border-2 border-dashed border-border text-center px-4">
          <p className="text-sm text-muted-foreground font-medium">No steps yet</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Add Step" to create the first onboarding screen</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={steps.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-3">
              {steps.map((step, index) => (
                <StepCard
                  key={step.id}
                  step={step}
                  index={index}
                  expanded={expandedIds.has(step.id)}
                  onToggleExpand={() => handleToggleExpand(step.id)}
                  onDelete={() => handleDelete(step.id)}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
