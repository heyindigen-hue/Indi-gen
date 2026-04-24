import { useRef, useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import type { ThemeConfig } from '@/types/sdui';
import { ThemePreview } from './_theme/ThemePreview';

// ---------------------------------------------------------------------------
// Preset definitions
// ---------------------------------------------------------------------------

const PRESETS: Record<string, ThemeConfig['colors']> = {
  graphite: {
    bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a', text: '#ffffff',
    muted: '#888888', accent: '#ffffff', success: '#22c55e',
    warning: '#f59e0b', destructive: '#ef4444',
  },
  vercel: {
    bg: '#000000', card: '#111111', border: '#333333', text: '#ededed',
    muted: '#888888', accent: '#0070f3', success: '#0ea5e9',
    warning: '#f97316', destructive: '#ff0000',
  },
  cron: {
    bg: '#fafafa', card: '#ffffff', border: '#e5e5e5', text: '#111111',
    muted: '#666666', accent: '#000000', success: '#16a34a',
    warning: '#d97706', destructive: '#dc2626',
  },
  custom: {
    bg: '#ffffff', card: '#f8f8f8', border: '#e0e0e0', text: '#000000',
    muted: '#666666', accent: '#6366f1', success: '#22c55e',
    warning: '#f59e0b', destructive: '#ef4444',
  },
};

const COLOR_ROLES: Array<keyof ThemeConfig['colors']> = [
  'bg', 'card', 'border', 'text', 'muted', 'accent', 'success', 'warning', 'destructive',
];

const PRESET_LABELS: Array<{ key: ThemeConfig['preset']; label: string }> = [
  { key: 'graphite', label: 'Graphite' },
  { key: 'vercel', label: 'Vercel' },
  { key: 'cron', label: 'Cron' },
  { key: 'custom', label: 'Custom' },
];

const DENSITY_OPTIONS: Array<{ key: ThemeConfig['density']; label: string }> = [
  { key: 'compact', label: 'Compact' },
  { key: 'comfortable', label: 'Comfortable' },
  { key: 'spacious', label: 'Spacious' },
];

const DEFAULT_THEME: ThemeConfig = {
  preset: 'graphite',
  colors: { ...PRESETS.graphite },
  font: 'inter',
  radius: 8,
  density: 'comfortable',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface PresetButtonProps {
  label: string;
  active: boolean;
  colors: ThemeConfig['colors'];
  onClick: () => void;
}

function PresetButton({ label, active, colors, onClick }: PresetButtonProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex flex-col gap-2 p-3 rounded-lg border text-left transition-all',
        active
          ? 'border-primary ring-1 ring-primary'
          : 'border-border hover:border-muted-foreground',
      ].join(' ')}
    >
      <div className="flex gap-1">
        {(['bg', 'card', 'accent', 'text'] as const).map((role) => (
          <div
            key={role}
            className="w-4 h-4 rounded-sm border border-black/10"
            style={{ backgroundColor: colors[role] }}
          />
        ))}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

interface ColorSwatchProps {
  role: keyof ThemeConfig['colors'];
  value: string;
  onChange: (role: keyof ThemeConfig['colors'], hex: string) => void;
}

function ColorSwatch({ role, value, onChange }: ColorSwatchProps) {
  const pickerRef = useRef<HTMLInputElement>(null);

  const handleHexBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/^#/, '');
      if (/^[0-9a-fA-F]{6}$/.test(raw)) {
        onChange(role, `#${raw}`);
      } else {
        e.target.value = value;
      }
    },
    [role, value, onChange],
  );

  const handlePickerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(role, e.target.value);
    },
    [role, onChange],
  );

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium text-muted-foreground capitalize">{role}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="w-7 h-7 rounded border border-border shrink-0 cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => pickerRef.current?.click()}
          aria-label={`Pick color for ${role}`}
        />
        <input
          type="color"
          ref={pickerRef}
          value={value}
          onChange={handlePickerChange}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />
        <input
          type="text"
          defaultValue={value}
          key={value}
          onBlur={handleHexBlur}
          maxLength={7}
          className="w-full h-7 rounded border border-border bg-background px-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label={`${role} hex value`}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function MobileUiThemePage() {
  const queryClient = useQueryClient();
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);

  const applyMutation = useMutation({
    mutationFn: () =>
      api.post('/admin/manifests', {
        platform: 'mobile',
        enabled: false,
        screens: { theme: { theme } },
      }),
    onSuccess: () => {
      toast.success('Theme applied to active manifest');
      queryClient.invalidateQueries({ queryKey: ['manifests'] });
    },
    onError: () => toast.error('Failed to apply theme'),
  });

  const handlePreset = useCallback((key: ThemeConfig['preset']) => {
    setTheme((prev) => ({
      ...prev,
      preset: key,
      colors: { ...PRESETS[key] },
    }));
  }, []);

  const handleColorChange = useCallback(
    (role: keyof ThemeConfig['colors'], hex: string) => {
      setTheme((prev) => ({
        ...prev,
        preset: 'custom',
        colors: { ...prev.colors, [role]: hex },
      }));
    },
    [],
  );

  const handleFontChange = useCallback((font: ThemeConfig['font']) => {
    setTheme((prev) => ({ ...prev, font }));
  }, []);

  const handleRadiusChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTheme((prev) => ({ ...prev, radius: Number(e.target.value) }));
    },
    [],
  );

  const handleDensity = useCallback((density: ThemeConfig['density']) => {
    setTheme((prev) => ({ ...prev, density }));
  }, []);

  return (
    <div className="flex gap-6 items-start">
      {/* Controls column */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">

        {/* Preset selector */}
        <section className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Preset
          </p>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_LABELS.map(({ key, label }) => (
              <PresetButton
                key={key}
                label={label}
                active={theme.preset === key}
                colors={PRESETS[key]}
                onClick={() => handlePreset(key)}
              />
            ))}
          </div>
        </section>

        {/* Color palette editor */}
        <section className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Colors
          </p>
          <div className="grid grid-cols-3 gap-x-4 gap-y-4">
            {COLOR_ROLES.map((role) => (
              <ColorSwatch
                key={role}
                role={role}
                value={theme.colors[role]}
                onChange={handleColorChange}
              />
            ))}
          </div>
        </section>

        {/* Font select */}
        <section className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Font
          </p>
          <Select value={theme.font} onValueChange={(v) => handleFontChange(v as ThemeConfig['font'])}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inter">Inter</SelectItem>
              <SelectItem value="geist">Geist</SelectItem>
              <SelectItem value="system">System Default</SelectItem>
            </SelectContent>
          </Select>
        </section>

        {/* Radius slider */}
        <section className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Corner Radius
            </p>
            <span className="text-xs text-muted-foreground tabular-nums">{theme.radius}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={24}
            step={1}
            value={theme.radius}
            onChange={handleRadiusChange}
            className="w-full accent-primary"
            aria-label="Corner radius"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0px</span>
            <span>24px</span>
          </div>
        </section>

        {/* Density toggle */}
        <section className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Density
          </p>
          <div className="flex gap-2">
            {DENSITY_OPTIONS.map(({ key, label }) => (
              <Button
                key={key}
                size="sm"
                variant={theme.density === key ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => handleDensity(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </section>

        {/* Apply button */}
        <div className="pt-1">
          <Label className="sr-only" htmlFor="apply-btn">Apply theme</Label>
          <Button
            id="apply-btn"
            className="w-full gap-2"
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending}
          >
            <Upload className="h-4 w-4" />
            {applyMutation.isPending ? 'Applying...' : 'Apply to active manifest'}
          </Button>
        </div>
      </div>

      {/* Preview column */}
      <div className="w-[400px] shrink-0 flex flex-col items-center gap-3 sticky top-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide self-start">
          Preview
        </p>
        <ThemePreview theme={theme} />
      </div>
    </div>
  );
}
