import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MailIcon, FilterIcon, RefreshIcon, XIcon } from '@/icons';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { relTime } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Invite = {
  id: string;
  email: string;
  role: string;
  sent_by?: string | null;
  expires_at: string;
  created_at: string;
};

type InvitesResponse = {
  invites: Invite[];
  total: number;
};

function NewInviteDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post('/admin/users/invite', { email, role }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-invites'] });
      toast.success(`Invite sent to ${email}`);
      setEmail('');
      setRole('user');
      onClose();
    },
    onError: () => toast.error('Failed to send invite'),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New invite</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="inv-email">Email</Label>
            <Input
              id="inv-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="inv-role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="inv-role" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="support">Support</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => mutate()}
            disabled={isPending || !email}
          >
            {isPending ? 'Sending...' : 'Send invite'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function InvitesPage() {
  const qc = useQueryClient();
  const [newOpen, setNewOpen] = useState(false);

  const { data, isLoading } = useQuery<InvitesResponse>({
    queryKey: ['admin-invites'],
    queryFn: () => api.get<InvitesResponse>('/admin/users/invites'),
  });

  const resend = useMutation({
    mutationFn: (id: string) => api.post(`/admin/users/invites/${id}/resend`),
    onSuccess: () => toast.success('Invite resent'),
    onError: () => toast.error('Failed to resend invite'),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/invites/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-invites'] });
      toast.success('Invite revoked');
    },
    onError: () => toast.error('Failed to revoke invite'),
  });

  const invites = data?.invites ?? [];

  return (
    <div>
      <PageHeader
        title="Invites"
        subtitle={isLoading ? 'Loading...' : `${data?.total ?? 0} pending`}
        actions={
          <Button size="sm" onClick={() => setNewOpen(true)}>
            <MailIcon size={16} className="mr-1" />
            New invite
          </Button>
        }
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Sent by</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : invites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground text-sm">
                  No pending invites
                </TableCell>
              </TableRow>
            ) : (
              invites.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium text-sm">{inv.email}</TableCell>
                  <TableCell className="text-sm capitalize">{inv.role}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {inv.sent_by ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {relTime(inv.expires_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <FilterIcon size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => resend.mutate(inv.id)}>
                          <RefreshIcon size={16} className="mr-2" />
                          Resend
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => revoke.mutate(inv.id)}
                        >
                          <XIcon size={16} className="mr-2" />
                          Revoke
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <NewInviteDialog open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}
