import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserIcon, TrashIcon } from '@/icons';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { relTime } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type WaitlistEntry = {
  id: string;
  email: string;
  signed_up_at: string;
  country?: string | null;
  country_code?: string | null;
};

type WaitlistResponse = {
  entries: WaitlistEntry[];
  total: number;
  waitlist_enabled: boolean;
};

function flagEmoji(code: string) {
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export default function WaitlistPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<WaitlistResponse>({
    queryKey: ['admin-waitlist'],
    queryFn: () => api.get<WaitlistResponse>('/admin/users/waitlist'),
  });

  const convert = useMutation({
    mutationFn: (id: string) => api.post(`/admin/users/waitlist/${id}/convert`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-waitlist'] });
      toast.success('Converted to user');
    },
    onError: () => toast.error('Failed to convert'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/waitlist/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-waitlist'] });
      toast.success('Removed from waitlist');
    },
    onError: () => toast.error('Failed to remove'),
  });

  const entries = data?.entries ?? [];

  if (!isLoading && data && !data.waitlist_enabled) {
    return (
      <div>
        <PageHeader title="Waitlist" subtitle="Waitlist is currently disabled" />
        <div className="flex items-center justify-center h-48 border border-dashed border-border rounded-lg">
          <p className="text-sm text-muted-foreground">
            Enable waitlist mode in{' '}
            <a href="/settings" className="underline">
              Settings → General
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Waitlist"
        subtitle={isLoading ? 'Loading...' : `${data?.total ?? 0} entries`}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Signed up</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground text-sm">
                  Waitlist is empty
                </TableCell>
              </TableRow>
            ) : (
              entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium text-sm">{e.email}</TableCell>
                  <TableCell className="text-sm">
                    {e.country_code ? (
                      <span className="flex items-center gap-1.5">
                        <span>{flagEmoji(e.country_code)}</span>
                        <span className="text-muted-foreground">{e.country_code}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {relTime(e.signed_up_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={convert.isPending}
                        onClick={() => convert.mutate(e.id)}
                      >
                        <UserIcon size={14} className="mr-1" />
                        Convert
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs text-red-600 hover:text-red-600"
                        disabled={remove.isPending}
                        onClick={() => remove.mutate(e.id)}
                      >
                        <TrashIcon size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
