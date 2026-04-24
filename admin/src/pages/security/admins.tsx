import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { MoreHorizontal, UserPlus, Check, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn, relTime } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRegisterCommand } from '@/store/commands';
import { useNavigate } from 'react-router-dom';

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'viewer';
  two_fa_enabled: boolean;
  last_login_at: string | null;
  created_at: string;
};

type AdminUsersResponse = {
  users: AdminUser[];
};

type DialogState =
  | { kind: 'none' }
  | { kind: 'invite' }
  | { kind: 'change_role'; user: AdminUser }
  | { kind: 'reset_password'; user: AdminUser }
  | { kind: 'revoke'; user: AdminUser };

const ROLE_BADGE_CLASSES: Record<AdminUser['role'], string> = {
  super_admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  admin: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  viewer: 'bg-muted text-muted-foreground',
};

const ROLE_LABELS: Record<AdminUser['role'], string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  viewer: 'Viewer',
};

function RoleBadge({ role }: { role: AdminUser['role'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        ROLE_BADGE_CLASSES[role],
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

const col = createColumnHelper<AdminUser>();

export default function AdminsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<DialogState>({ kind: 'none' });

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AdminUser['role']>('viewer');

  // Change role form state
  const [selectedRole, setSelectedRole] = useState<AdminUser['role']>('viewer');

  const { data, isLoading } = useQuery<AdminUsersResponse>({
    queryKey: ['admin-users'],
    queryFn: () => api.get<AdminUsersResponse>('/api/admin/admin-users'),
  });

  const inviteMutation = useMutation({
    mutationFn: (body: { email: string; role: AdminUser['role'] }) =>
      api.post('/api/admin/admin-users/invite', body),
    onSuccess: () => {
      toast.success('Invitation sent');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setDialog({ kind: 'none' });
      setInviteEmail('');
      setInviteRole('viewer');
    },
    onError: () => toast.error('Failed to send invitation'),
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: AdminUser['role'] }) =>
      api.patch(`/api/admin/admin-users/${id}`, { role }),
    onSuccess: () => {
      toast.success('Role updated');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setDialog({ kind: 'none' });
    },
    onError: () => toast.error('Failed to update role'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/admin/admin-users/${id}/reset-password`, {}),
    onSuccess: () => {
      toast.success('Password reset email sent');
      setDialog({ kind: 'none' });
    },
    onError: () => toast.error('Failed to reset password'),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/admin-users/${id}`),
    onSuccess: () => {
      toast.success('Access revoked');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setDialog({ kind: 'none' });
    },
    onError: () => toast.error('Failed to revoke access'),
  });

  const columns = [
    col.accessor('email', {
      header: 'Admin',
      cell: (info) => (
        <div>
          <p className="font-medium text-sm">{info.getValue()}</p>
          <p className="text-xs text-muted-foreground">{info.row.original.name}</p>
        </div>
      ),
    }),
    col.accessor('role', {
      header: 'Role',
      cell: (info) => <RoleBadge role={info.getValue()} />,
    }),
    col.accessor('two_fa_enabled', {
      header: '2FA',
      cell: (info) =>
        info.getValue() ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Minus className="h-4 w-4 text-muted-foreground" />
        ),
    }),
    col.accessor('last_login_at', {
      header: 'Last Login',
      cell: (info) => {
        const v = info.getValue();
        return (
          <span className="text-sm text-muted-foreground">
            {v ? relTime(v) : 'Never'}
          </span>
        );
      },
    }),
    col.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => {
                setSelectedRole(row.original.role);
                setDialog({ kind: 'change_role', user: row.original });
              }}
            >
              Change role
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                setDialog({ kind: 'reset_password', user: row.original })
              }
            >
              Reset password
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() =>
                setDialog({ kind: 'revoke', user: row.original })
              }
            >
              Revoke access
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }),
  ];

  const table = useReactTable({
    data: data?.users ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  useRegisterCommand(
    {
      id: 'security.admins',
      label: 'Admin users',
      group: 'Security',
      action: () => navigate('/security/admins'),
    },
    [],
  );

  return (
    <div>
      <PageHeader
        title="Admin Users"
        subtitle="Manage who has access to this admin panel"
        actions={
          <Button
            size="sm"
            onClick={() => setDialog({ kind: 'invite' })}
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            Invite admin
          </Button>
        }
      />

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No admin users found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invite Dialog */}
      <Dialog
        open={dialog.kind === 'invite'}
        onOpenChange={(open) => !open && setDialog({ kind: 'none' })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as AdminUser['role'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ kind: 'none' })}>
              Cancel
            </Button>
            <Button
              disabled={!inviteEmail || inviteMutation.isPending}
              onClick={() =>
                inviteMutation.mutate({ email: inviteEmail, role: inviteRole })
              }
            >
              {inviteMutation.isPending ? 'Sending...' : 'Send invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog
        open={dialog.kind === 'change_role'}
        onOpenChange={(open) => !open && setDialog({ kind: 'none' })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
          </DialogHeader>
          {dialog.kind === 'change_role' && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Change role for <strong>{dialog.user.email}</strong>
              </p>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(v) => setSelectedRole(v as AdminUser['role'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ kind: 'none' })}>
              Cancel
            </Button>
            <Button
              disabled={changeRoleMutation.isPending}
              onClick={() => {
                if (dialog.kind === 'change_role') {
                  changeRoleMutation.mutate({
                    id: dialog.user.id,
                    role: selectedRole,
                  });
                }
              }}
            >
              {changeRoleMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={dialog.kind === 'reset_password'}
        onOpenChange={(open) => !open && setDialog({ kind: 'none' })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          {dialog.kind === 'reset_password' && (
            <p className="text-sm text-muted-foreground py-2">
              A password reset email will be sent to{' '}
              <strong>{dialog.user.email}</strong>. They will need to set a new
              password before logging in.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ kind: 'none' })}>
              Cancel
            </Button>
            <Button
              disabled={resetPasswordMutation.isPending}
              onClick={() => {
                if (dialog.kind === 'reset_password') {
                  resetPasswordMutation.mutate(dialog.user.id);
                }
              }}
            >
              {resetPasswordMutation.isPending ? 'Sending...' : 'Send reset email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Access Dialog */}
      <Dialog
        open={dialog.kind === 'revoke'}
        onOpenChange={(open) => !open && setDialog({ kind: 'none' })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Access</DialogTitle>
          </DialogHeader>
          {dialog.kind === 'revoke' && (
            <p className="text-sm text-muted-foreground py-2">
              This will permanently revoke admin access for{' '}
              <strong>{dialog.user.email}</strong>. This action cannot be
              undone.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ kind: 'none' })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={revokeMutation.isPending}
              onClick={() => {
                if (dialog.kind === 'revoke') {
                  revokeMutation.mutate(dialog.user.id);
                }
              }}
            >
              {revokeMutation.isPending ? 'Revoking...' : 'Revoke access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
