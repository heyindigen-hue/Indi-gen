import { UploadIcon, RefreshIcon } from '@/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Manifest } from '@/types/sdui';

interface ManifestVersionDropdownProps {
  versions: Manifest[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onPublish: (id: string) => void;
  onRollback: (id: string) => void;
}

export function ManifestVersionDropdown({
  versions,
  activeId,
  onSelect,
  onPublish,
  onRollback,
}: ManifestVersionDropdownProps) {
  const selected = versions.find((v) => v.id === activeId) ?? null;
  const isLive = selected?.enabled ?? false;

  if (versions.length === 0) {
    return (
      <div className="text-xs text-muted-foreground px-2">No versions yet</div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Select value={activeId ?? ''} onValueChange={onSelect}>
        <SelectTrigger className="h-8 text-xs w-full">
          <SelectValue placeholder="Select version">
            {selected ? (
              <span className="flex items-center gap-2">
                <span>v{selected.version}</span>
                {selected.enabled && (
                  <Badge variant="success" className="text-[10px] px-1.5 py-0">live</Badge>
                )}
              </span>
            ) : (
              'Select version'
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {versions.map((v) => (
            <SelectItem key={v.id} value={v.id}>
              <span className={cn('flex items-center gap-2 text-xs')}>
                <span>v{v.version}</span>
                {v.enabled && (
                  <Badge variant="success" className="text-[10px] px-1.5 py-0">live</Badge>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selected && !isLive && (
        <Button
          size="sm"
          variant="default"
          className="h-7 text-xs gap-1 w-full"
          onClick={() => onPublish(selected.id)}
        >
          <UploadIcon size={12} />
          Publish this version
        </Button>
      )}

      {selected && isLive && versions.length > 1 && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1 w-full"
          onClick={() => onRollback(selected.id)}
        >
          <RefreshIcon size={12} />
          Rollback
        </Button>
      )}
    </div>
  );
}
