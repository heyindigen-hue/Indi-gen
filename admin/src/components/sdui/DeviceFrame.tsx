import React from 'react';
import { cn } from '@/lib/utils';

interface DeviceFrameProps {
  device: 'iphone' | 'android';
  children?: React.ReactNode;
  className?: string;
}

function StatusBar() {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return (
    <div className="h-11 shrink-0 flex items-center justify-between px-6 bg-black/5">
      <span className="text-[11px] font-semibold text-zinc-700">{time}</span>
      <div className="flex items-center gap-1">
        <div className="w-3 h-2 border border-zinc-500 rounded-sm relative">
          <div className="absolute inset-[1px] right-auto w-2/3 bg-zinc-500 rounded-[1px]" />
        </div>
        <div className="flex gap-0.5 items-end h-2.5">
          <div className="w-[3px] h-[4px] bg-zinc-500 rounded-sm" />
          <div className="w-[3px] h-[6px] bg-zinc-500 rounded-sm" />
          <div className="w-[3px] h-[8px] bg-zinc-500 rounded-sm" />
          <div className="w-[3px] h-[10px] bg-zinc-500 rounded-sm" />
        </div>
      </div>
    </div>
  );
}

function IphoneFrame({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative mx-auto bg-zinc-900 rounded-[2.5rem] border-[3px] border-zinc-700',
        'w-[375px] h-[812px] flex flex-col',
        className,
      )}
      style={{ boxShadow: '0 32px 64px rgba(255,71,22,0.08), 0 8px 24px rgba(0,0,0,0.10)' }}
    >
      {/* Dynamic island */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10" />

      {/* Screen */}
      <div className="flex-1 mx-[3px] my-[3px] rounded-[2.3rem] bg-white overflow-hidden flex flex-col">
        {/* Status bar */}
        <StatusBar />

        {/* Content area */}
        <div className="flex-1 overflow-hidden relative">{children}</div>

        {/* Home indicator */}
        <div className="h-8 shrink-0 flex items-center justify-center">
          <div className="w-28 h-1 bg-black/30 rounded-full" />
        </div>
      </div>

      {/* Side buttons */}
      <div className="absolute -left-[5px] top-24 w-[4px] h-8 bg-zinc-600 rounded-l-sm" />
      <div className="absolute -left-[5px] top-36 w-[4px] h-12 bg-zinc-600 rounded-l-sm" />
      <div className="absolute -left-[5px] top-52 w-[4px] h-12 bg-zinc-600 rounded-l-sm" />
      <div className="absolute -right-[5px] top-36 w-[4px] h-16 bg-zinc-600 rounded-r-sm" />
    </div>
  );
}

function AndroidFrame({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative mx-auto bg-zinc-800 rounded-[1.5rem] border-[3px] border-zinc-600',
        'w-[375px] h-[812px] flex flex-col',
        className,
      )}
      style={{ boxShadow: '0 32px 64px rgba(255,71,22,0.08), 0 8px 24px rgba(0,0,0,0.10)' }}
    >
      {/* Punch-hole camera */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full z-10" />

      {/* Screen */}
      <div className="flex-1 mx-[3px] my-[3px] rounded-[1.3rem] bg-white overflow-hidden flex flex-col">
        {/* Status bar */}
        <div className="h-9 shrink-0 bg-black/5" />

        {/* Content area */}
        <div className="flex-1 overflow-hidden relative">{children}</div>

        {/* Navigation bar */}
        <div className="h-8 shrink-0 flex items-center justify-center gap-8 bg-black/5">
          <div className="w-4 h-4 border-2 border-zinc-400 rounded-sm" />
          <div className="w-4 h-4 border-2 border-zinc-400 rounded-full" />
          <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-zinc-400 rotate-90" />
        </div>
      </div>

      {/* Power button */}
      <div className="absolute -right-[5px] top-32 w-[4px] h-12 bg-zinc-500 rounded-r-sm" />
      {/* Volume buttons */}
      <div className="absolute -left-[5px] top-24 w-[4px] h-8 bg-zinc-500 rounded-l-sm" />
      <div className="absolute -left-[5px] top-36 w-[4px] h-8 bg-zinc-500 rounded-l-sm" />
    </div>
  );
}

export function DeviceFrame({ device, children, className }: DeviceFrameProps) {
  if (device === 'android') {
    return <AndroidFrame className={className}>{children}</AndroidFrame>;
  }
  return <IphoneFrame className={className}>{children}</IphoneFrame>;
}
