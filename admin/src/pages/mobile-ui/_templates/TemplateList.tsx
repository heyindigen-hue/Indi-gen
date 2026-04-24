import { cn } from '@/lib/utils';

interface ListItem {
  id: string;
  name: string;
  preview: string;
}

interface TemplateListProps {
  items: ListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}

function Skeleton() {
  return (
    <div className="p-3 border-b border-border last:border-b-0 animate-pulse">
      <div className="h-3.5 w-28 bg-muted rounded mb-1.5" />
      <div className="h-3 w-36 bg-muted rounded" />
    </div>
  );
}

export function TemplateList({ items, selectedId, onSelect, loading }: TemplateListProps) {
  if (loading) {
    return (
      <div className="w-[250px] shrink-0 rounded-lg border border-border bg-card overflow-y-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="w-[250px] shrink-0 rounded-lg border border-border bg-card overflow-y-auto">
      {items.length === 0 && (
        <p className="p-4 text-sm text-muted-foreground">No templates found.</p>
      )}
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={cn(
            'w-full text-left p-3 border-b border-border last:border-b-0',
            'hover:bg-accent/60 transition-colors',
            selectedId === item.id && 'bg-accent',
          )}
        >
          <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.preview}</p>
        </button>
      ))}
    </div>
  );
}
