import FlowerMark from './FlowerMark';

interface LeadCardProps {
  name: string;
  role: string;
  company: string;
  score: number;
  tag: string;
  variant?: 'cream' | 'paper' | 'ink';
  small?: boolean;
}

export default function LeadCard({
  name,
  role,
  company,
  score,
  tag,
  variant = 'paper',
  small = false,
}: LeadCardProps) {
  const isInk = variant === 'ink';
  const bg = variant === 'paper' ? 'var(--paper)' : variant === 'cream' ? 'var(--cream)' : 'var(--ink)';
  const fg = isInk ? 'var(--cream)' : 'var(--ink)';
  const muted = isInk ? 'rgba(247,241,229,0.55)' : 'rgba(14,14,12,0.55)';
  const border = isInk ? 'rgba(247,241,229,0.16)' : 'var(--line)';
  return (
    <div
      className="rounded-2xl flex flex-col gap-3 select-none"
      style={{
        backgroundColor: bg,
        color: fg,
        border: `1px solid ${border}`,
        padding: small ? '14px' : '18px',
        width: small ? 220 : 280,
        minHeight: small ? 130 : 160,
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: small ? 28 : 36,
            height: small ? 28 : 36,
            backgroundColor: isInk ? 'rgba(247,241,229,0.06)' : 'rgba(14,14,12,0.06)',
          }}
        >
          <FlowerMark
            size={small ? 18 : 22}
            petal={isInk ? 'rgba(247,241,229,0.8)' : 'rgba(14,14,12,0.5)'}
            core="var(--orange)"
          />
        </div>
        <div className="min-w-0">
          <div
            style={{ fontSize: small ? 13 : 14, fontWeight: 600, letterSpacing: '-0.01em' }}
          >
            {name}
          </div>
          <div className="mono" style={{ color: muted, fontSize: 9.5 }}>
            {role}
          </div>
        </div>
      </div>
      <div style={{ fontSize: small ? 12 : 13, color: muted }}>{company}</div>
      <div className="mt-auto flex items-center justify-between">
        <span
          className="mono"
          style={{
            fontSize: 9.5,
            padding: '3px 8px',
            borderRadius: 999,
            backgroundColor: isInk ? 'rgba(247,241,229,0.08)' : 'rgba(14,14,12,0.05)',
            color: muted,
          }}
        >
          {tag}
        </span>
        <span
          className="mono"
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: score >= 7.5 ? 'var(--orange)' : muted,
          }}
        >
          {score.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
