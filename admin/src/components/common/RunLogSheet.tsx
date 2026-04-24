import { useEffect, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export interface LogLine {
  ts: string;
  level?: 'info' | 'warn' | 'error';
  message: string;
}

interface RunLogSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  lines: LogLine[];
  status?: 'running' | 'completed' | 'failed';
}

const LEVEL_COLORS: Record<string, string> = {
  info: 'text-zinc-300',
  warn: 'text-amber-400',
  error: 'text-red-400',
};

export function RunLogSheet({
  open,
  onOpenChange,
  title,
  description,
  lines,
  status,
}: RunLogSheetProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, lines.length]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[600px] sm:max-w-[600px] flex flex-col p-6">
        <SheetHeader className="shrink-0">
          <div className="flex items-center gap-2">
            <SheetTitle>{title ?? 'Run Log'}</SheetTitle>
            {status && (
              <Badge
                variant={
                  status === 'failed'
                    ? 'destructive'
                    : status === 'running'
                    ? 'secondary'
                    : 'outline'
                }
                className="text-xs"
              >
                {status}
              </Badge>
            )}
          </div>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <ScrollArea className="flex-1 mt-4 rounded border border-border bg-zinc-950 p-3">
          <pre className="text-xs font-mono leading-relaxed">
            {lines.length === 0 ? (
              <span className="text-zinc-500">No log output.</span>
            ) : (
              lines.map((line, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-zinc-500 shrink-0 select-none whitespace-nowrap">
                    {line.ts}
                  </span>
                  <span className={LEVEL_COLORS[line.level ?? 'info']}>{line.message}</span>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </pre>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
