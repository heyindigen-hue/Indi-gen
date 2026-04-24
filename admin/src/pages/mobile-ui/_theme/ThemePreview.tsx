import { DeviceFrame } from '@/components/sdui/DeviceFrame';
import type { ThemeConfig } from '@/types/sdui';

interface ThemePreviewProps {
  theme: ThemeConfig;
}

export function ThemePreview({ theme }: ThemePreviewProps) {
  const { colors, radius } = theme;
  const r = `${radius}px`;

  return (
    <DeviceFrame device="iphone">
      <div
        className="h-full overflow-y-auto flex flex-col"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        {/* Status bar */}
        <div
          className="flex items-center justify-between px-4 py-2 text-xs shrink-0"
          style={{ backgroundColor: colors.bg, color: colors.muted }}
        >
          <span>9:41</span>
          <span>100%</span>
        </div>

        {/* Header */}
        <div
          className="px-4 py-3 border-b shrink-0"
          style={{ borderColor: colors.border, backgroundColor: colors.card }}
        >
          <h1 className="text-base font-semibold" style={{ color: colors.text }}>
            My App
          </h1>
          <p className="text-xs mt-0.5" style={{ color: colors.muted }}>
            Welcome back
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3 p-4 flex-1">
          {/* Card 1 */}
          <div
            className="p-3 border"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: r,
            }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: colors.muted }}>
              Leads Today
            </p>
            <p className="text-lg font-bold" style={{ color: colors.text }}>
              24
            </p>
            <p className="text-xs mt-1" style={{ color: colors.success }}>
              +12% vs yesterday
            </p>
          </div>

          {/* Card 2 */}
          <div
            className="p-3 border"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: r,
            }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: colors.muted }}>
              Token Balance
            </p>
            <p className="text-lg font-bold" style={{ color: colors.text }}>
              1,200
            </p>
            <p className="text-xs mt-1" style={{ color: colors.warning }}>
              Low balance
            </p>
          </div>

          {/* Sample button */}
          <button
            className="w-full py-2.5 text-sm font-semibold mt-1"
            style={{
              backgroundColor: colors.accent,
              color: colors.bg,
              borderRadius: r,
              border: 'none',
            }}
          >
            Get More Leads
          </button>

          {/* Destructive example */}
          <button
            className="w-full py-2 text-xs font-medium"
            style={{
              backgroundColor: 'transparent',
              color: colors.destructive,
              borderRadius: r,
              border: `1px solid ${colors.destructive}`,
            }}
          >
            Delete Account
          </button>
        </div>
      </div>
    </DeviceFrame>
  );
}
