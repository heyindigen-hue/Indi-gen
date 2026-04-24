import { useState } from 'react';
import {
  Home, Search, Bell, User, Settings, Star, Heart, Bookmark,
  Mail, Phone, Camera, Map, MapPin, Calendar, Clock, Edit,
  Trash2, Plus, Minus, Check, X, ChevronRight, ChevronDown,
  ArrowLeft, ArrowRight, Share, Download, Upload, Link,
  Zap, Target, TrendingUp, BarChart2, PieChart, Grid,
  List, Filter, Tag, Flag, Lock, Unlock, Eye, EyeOff,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Home, Search, Bell, User, Settings, Star, Heart, Bookmark,
  Mail, Phone, Camera, Map, MapPin, Calendar, Clock, Edit,
  Trash2, Plus, Minus, Check, X, ChevronRight, ChevronDown,
  ArrowLeft, ArrowRight, Share, Download, Upload, Link,
  Zap, Target, TrendingUp, BarChart2, PieChart, Grid,
  List, Filter, Tag, Flag, Lock, Unlock, Eye, EyeOff,
};

const ICON_NAMES = Object.keys(ICON_MAP);

function IconDisplay({ name, size = 16 }: { name: string; size?: number }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return <span className="text-xs text-muted-foreground">?</span>;
  return <Icon size={size} />;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = query.trim()
    ? ICON_NAMES.filter((n) => n.toLowerCase().includes(query.toLowerCase()))
    : ICON_NAMES;

  const handleSelect = (name: string) => {
    onChange(name);
    setOpen(false);
    setQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-md border border-input bg-transparent',
            'text-sm hover:bg-accent transition-colors',
          )}
          aria-label="Pick an icon"
        >
          {value ? (
            <>
              <IconDisplay name={value} />
              <span className="text-xs text-muted-foreground">{value}</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Select icon</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search icons..."
          className={cn(
            'w-full mb-3 px-2.5 py-1.5 rounded-md border border-input bg-transparent',
            'text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring',
          )}
        />
        <div className="grid grid-cols-7 gap-1 max-h-52 overflow-y-auto">
          {filtered.map((name) => (
            <button
              key={name}
              title={name}
              onClick={() => handleSelect(name)}
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-md transition-colors',
                'hover:bg-accent',
                value === name && 'bg-primary text-primary-foreground hover:bg-primary',
              )}
              aria-label={name}
            >
              <IconDisplay name={name} />
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-7 text-center text-xs text-muted-foreground py-4">No icons found</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
