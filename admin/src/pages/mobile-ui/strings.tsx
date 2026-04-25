import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SearchIcon, PlusIcon, UploadIcon, SparkleIcon } from '@/icons';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ---- Types ----

interface StringEntry {
  key: string;
  value: string;
}

interface StringsApiResponse {
  strings: StringEntry[];
}

// ---- Constants ----

const INITIAL_LOCALES = ['en-IN', 'hi-IN'];

const SAMPLE: StringEntry[] = [
  { key: 'login.cta', value: 'Sign in' },
  { key: 'login.apple', value: 'Continue with Apple' },
  { key: 'login.google', value: 'Continue with Google' },
  { key: 'tabs.home', value: 'Home' },
  { key: 'tabs.explore', value: 'Saved' },
  { key: 'tabs.outreach', value: 'Outreach' },
  { key: 'tabs.insights', value: 'Insights' },
  { key: 'tabs.settings', value: 'Settings' },
  { key: 'home.no_leads', value: 'No leads yet' },
  { key: 'home.pull_to_refresh', value: 'Pull to refresh' },
  { key: 'lead.save', value: 'Save' },
  { key: 'lead.skip', value: 'Skip' },
  { key: 'lead.contact', value: 'Contact' },
  { key: 'paywall.headline', value: 'Get more leads' },
  { key: 'common.loading', value: 'Loading...' },
  { key: 'common.error', value: 'Something went wrong' },
  { key: 'common.retry', value: 'Retry' },
  { key: 'onboarding.skip', value: 'Skip' },
  { key: 'onboarding.next', value: 'Next' },
  { key: 'onboarding.continue', value: 'Continue' },
];

// ---- Helpers ----

function parseCSV(csv: string): StringEntry[] {
  return csv
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const commaIdx = line.indexOf(',');
      if (commaIdx === -1) return null;
      const key = line.slice(0, commaIdx).trim();
      const value = line.slice(commaIdx + 1).trim();
      return key ? { key, value } : null;
    })
    .filter((entry): entry is StringEntry => entry !== null);
}

function entriesToMap(entries: StringEntry[]): Record<string, string> {
  return Object.fromEntries(entries.map(({ key, value }) => [key, value]));
}

// ---- Sub-components ----

interface InlineEditCellProps {
  value: string;
  onSave: (value: string) => void;
}

function InlineEditCell({ value, onSave }: InlineEditCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = useCallback(() => {
    setEditing(false);
    onSave(draft);
  }, [draft, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') {
      setDraft(value);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <Input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="h-7 text-sm py-1"
      />
    );
  }

  return (
    <span
      className="cursor-pointer rounded px-1 py-0.5 hover:bg-accent text-sm block truncate"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      title={value || 'Click to edit'}
    >
      {value || <span className="text-muted-foreground italic">empty</span>}
    </span>
  );
}

interface CsvImportSheetProps {
  onImport: (entries: StringEntry[]) => void;
  onClose: () => void;
}

function CsvImportSheet({ onImport, onClose }: CsvImportSheetProps) {
  const [csv, setCsv] = useState('');

  const handleImport = () => {
    const entries = parseCSV(csv);
    if (entries.length === 0) {
      toast.error('No valid rows found. Format: key,value');
      return;
    }
    onImport(entries);
    toast.success(`Imported ${entries.length} string${entries.length !== 1 ? 's' : ''}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Bulk import CSV</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">
            Close
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Paste CSV rows below. Format: <code className="font-mono bg-muted px-1 rounded">key,value</code> — one per line.
        </p>
        <textarea
          className={cn(
            'w-full rounded-md border border-input bg-transparent px-3 py-2 resize-none',
            'text-sm font-mono text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-1 focus:ring-ring min-h-[160px]',
          )}
          placeholder="login.cta,Get Started&#10;tabs.home,Home"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleImport}>
            Import
          </Button>
        </div>
      </div>
    </div>
  );
}

interface AddLocaleFormProps {
  existing: string[];
  onAdd: (locale: string) => void;
  onCancel: () => void;
}

function AddLocaleForm({ existing, onAdd, onCancel }: AddLocaleFormProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (existing.includes(trimmed)) {
      toast.error(`Locale "${trimmed}" already exists`);
      return;
    }
    onAdd(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={inputRef}
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. ta-IN"
        className="h-7 text-xs w-28"
      />
      <Button size="sm" className="h-7 text-xs px-2" onClick={handleAdd}>
        Add
      </Button>
      <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground">
        Cancel
      </button>
    </div>
  );
}

// ---- Main page ----

export default function StringsPage() {
  const queryClient = useQueryClient();

  const [locales, setLocales] = useState<string[]>(INITIAL_LOCALES);
  const [activeLocale, setActiveLocale] = useState<string>(INITIAL_LOCALES[0]);
  const [strings, setStrings] = useState<Record<string, Record<string, string>>>({});
  const [search, setSearch] = useState('');
  const [showAddLocale, setShowAddLocale] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);

  const { data: stringsData, isError: stringsError } = useQuery<StringsApiResponse>({
    queryKey: ['i18n-strings', activeLocale],
    queryFn: () => api.get<StringsApiResponse>(`/admin/i18n-strings?locale=${activeLocale}`),
  });

  useEffect(() => {
    if (stringsData) {
      setStrings((prev) => ({
        ...prev,
        [activeLocale]: entriesToMap(stringsData.strings),
      }));
    }
  }, [stringsData, activeLocale]);

  useEffect(() => {
    if (stringsError) {
      setStrings((prev) => {
        if (prev[activeLocale]) return prev;
        return { ...prev, [activeLocale]: entriesToMap(SAMPLE) };
      });
    }
  }, [stringsError, activeLocale]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const currentStrings = strings[activeLocale] ?? {};
      const payload = {
        locale: activeLocale,
        strings: Object.entries(currentStrings).map(([key, value]) => ({ key, value })),
      };
      return api.post('/admin/i18n-strings', payload);
    },
    onSuccess: () => {
      toast.success('Strings saved');
      queryClient.invalidateQueries({ queryKey: ['i18n-strings', activeLocale] });
    },
    onError: () => toast.error('Failed to save strings'),
  });

  const currentMap = strings[activeLocale] ?? entriesToMap(SAMPLE);
  const allKeys = Object.keys(currentMap);

  const filteredKeys = search.trim()
    ? allKeys.filter(
        (key) =>
          key.toLowerCase().includes(search.toLowerCase()) ||
          (currentMap[key] ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : allKeys;

  const handleValueSave = useCallback((key: string, value: string) => {
    setStrings((prev) => ({
      ...prev,
      [activeLocale]: { ...(prev[activeLocale] ?? entriesToMap(SAMPLE)), [key]: value },
    }));
  }, [activeLocale]);

  const handleAddKey = () => {
    const base = 'new.key';
    let candidate = base;
    let i = 1;
    while (currentMap[candidate] !== undefined) {
      candidate = `${base}.${i}`;
      i++;
    }
    setStrings((prev) => ({
      ...prev,
      [activeLocale]: { ...(prev[activeLocale] ?? {}), [candidate]: '' },
    }));
  };

  const handleAddLocale = (locale: string) => {
    setLocales((prev) => [...prev, locale]);
    setActiveLocale(locale);
    setShowAddLocale(false);
  };

  const handleCsvImport = (entries: StringEntry[]) => {
    setStrings((prev) => ({
      ...prev,
      [activeLocale]: { ...(prev[activeLocale] ?? {}), ...entriesToMap(entries) },
    }));
  };

  const handleAiTranslate = (key: string) => {
    console.log('todo: ai translate', key);
    toast.info('AI translate — coming soon');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Locale pills */}
          <div className="flex items-center gap-1">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => setActiveLocale(locale)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  locale === activeLocale
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {locale}
              </button>
            ))}
          </div>

          {/* Add locale */}
          {showAddLocale ? (
            <AddLocaleForm
              existing={locales}
              onAdd={handleAddLocale}
              onCancel={() => setShowAddLocale(false)}
            />
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 px-2"
              onClick={() => setShowAddLocale(true)}
            >
              <PlusIcon size={12} />
              Add locale
            </Button>
          )}

          <Separator orientation="vertical" className="h-5" />

          {/* Search */}
          <div className="relative">
            <SearchIcon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search keys or values…"
              className="h-7 pl-7 text-xs w-52"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5"
            onClick={() => setShowCsvImport(true)}
          >
            <UploadIcon size={12} />
            Bulk import CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5"
            onClick={handleAddKey}
          >
            <PlusIcon size={12} />
            Add Key
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        {/* Column headers */}
        <div className="hidden sm:grid grid-cols-[2fr_3fr_auto] gap-0 bg-muted/40 border-b border-border px-4 py-2">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Key</span>
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Value — {activeLocale}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide w-24 text-right">
            Actions
          </span>
        </div>

        {filteredKeys.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
            {search ? 'No keys match your search' : 'No strings yet — click Add Key to start'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredKeys.map((key) => (
              <div
                key={key}
                className="grid grid-cols-1 sm:grid-cols-[2fr_3fr_auto] gap-1 sm:gap-0 px-3 sm:px-4 py-3 sm:py-2 items-start sm:items-center hover:bg-accent/30 transition-colors"
              >
                {/* Key — read-only monospace */}
                <span className="text-xs font-mono text-muted-foreground truncate sm:pr-4" title={key}>
                  {key}
                </span>

                {/* Value — inline editable */}
                <div className="sm:pr-4 min-w-0">
                  <InlineEditCell
                    value={currentMap[key] ?? ''}
                    onSave={(value) => handleValueSave(key, value)}
                  />
                </div>

                {/* Actions */}
                <div className="sm:w-24 flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => handleAiTranslate(key)}
                  >
                    <SparkleIcon size={11} />
                    AI
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Row count */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {filteredKeys.length} {search ? 'matching' : 'total'} key{filteredKeys.length !== 1 ? 's' : ''}
        </Badge>
        {search && (
          <span className="text-xs text-muted-foreground">of {allKeys.length} total</span>
        )}
      </div>

      {/* CSV Import modal */}
      {showCsvImport && (
        <CsvImportSheet onImport={handleCsvImport} onClose={() => setShowCsvImport(false)} />
      )}
    </div>
  );
}
