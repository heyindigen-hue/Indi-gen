import { useState } from 'react';
import {
  HomeIcon, SearchIcon, BellIcon, UserIcon, SettingsIcon, StarIcon, BookmarkIcon,
  MailIcon, CalendarIcon, ClockIcon, EditIcon,
  TrashIcon, PlusIcon, XIcon, ChevronRightIcon, ChevronDownIcon,
  ArrowRightIcon, DownloadIcon, UploadIcon, LinkIcon,
  ZapIcon, LeadIcon, ChartIcon, FilterIcon, TagIcon, ShieldIcon, EyeIcon,
} from '@/icons';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  color?: string;
}

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

const ICON_MAP: Record<string, React.ComponentType<IconProps>> = {
  Home: HomeIcon,
  Search: SearchIcon,
  Bell: BellIcon,
  User: UserIcon,
  Settings: SettingsIcon,
  Star: StarIcon,
  Bookmark: BookmarkIcon,
  Mail: MailIcon,
  Calendar: CalendarIcon,
  Clock: ClockIcon,
  Edit: EditIcon,
  Trash: TrashIcon,
  Plus: PlusIcon,
  X: XIcon,
  ChevronRight: ChevronRightIcon,
  ChevronDown: ChevronDownIcon,
  ArrowRight: ArrowRightIcon,
  Download: DownloadIcon,
  Upload: UploadIcon,
  Link: LinkIcon,
  Zap: ZapIcon,
  Lead: LeadIcon,
  Chart: ChartIcon,
  Filter: FilterIcon,
  Tag: TagIcon,
  Shield: ShieldIcon,
  Eye: EyeIcon,
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
