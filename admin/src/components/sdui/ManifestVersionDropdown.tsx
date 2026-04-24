import { Upload, RotateCcw } from 'lucide-react';
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
  onPublish: (id: string) => void;
  onRollback: (id: string) => void;
}

function VersionLabel({ manifest }: { manifest: Manifest }) {
  return (
    <span className="flex items-center gap-2">
      <span>v{manifest.version}</span>
      {manifest.enabled && (
        <Badge variant="success" className="text-[10px] px-1.5 py-0">live</Badge>
      )}
    </span>
  );
}

export function ManifestVersionDropdown({
  versions,
  activeId,
  onPublish,
  onRollback,
}: ManifestVersionDropdownProps) {
  const selected = versions.find((v) => v.id === activeId) ?? null;
  const isLive = selected?.enabled ?? false;

  if (versions.length === 0) {
    return (
      <div className="text-xs text-muted-foreground px-2">No versions</div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={activeId ?? ''} onValueChange={() => {}}>
        <SelectTrigger className="h-8 text-xs w-36">
          <SelectValue placeholder="Select version">
            {selected ? <VersionLabel manifest={selected} /> : 'Select version'}
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
          className="h-8 text-xs gap-1.5"
          onClick={() => onPublish(selected.id)}
        >
          <Upload className="h-3.5 w-3.5" />
          Publish
        </Button>
      )}

      {selected && isLive && versions.length > 1 && (
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs gap-1.5"
          onClick={() => onRollback(selected.id)}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Rollback
        </Button>
      )}
    </div>
  );
}
