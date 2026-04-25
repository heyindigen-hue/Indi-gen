import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { relTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

// --- Types ---
type Session = { id: string; device: string; ip: string; last_seen: string };

// --- Schemas ---
const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  old_password: z.string().min(1, 'Required'),
  new_password: z.string().min(8, 'Min 8 characters'),
  confirm_new_password: z.string().min(1, 'Required'),
}).refine((d) => d.new_password === d.confirm_new_password, {
  message: 'Passwords do not match',
  path: ['confirm_new_password'],
});
type PasswordValues = z.infer<typeof passwordSchema>;

// --- Sub-sections ---
function ProfileSection() {
  const setUser = useAuth((s) => s.setUser);
  const user = useAuth((s) => s.user);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', phone: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: ProfileValues) => api.patch('/users/me', data),
    onSuccess: (updated) => {
      setUser(updated as typeof user extends null ? never : NonNullable<typeof user>);
      toast.success('Profile updated');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Update failed'),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Profile</h3>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={user?.email ?? ''} readOnly className="opacity-60 cursor-not-allowed" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" {...register('phone')} placeholder="+91 98765 43210" />
      </div>
      <Button type="submit" disabled={mutation.isPending} size="sm">
        {mutation.isPending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  );
}

function PasswordSection() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: PasswordValues) => api.post('/users/me/change-password', data),
    onSuccess: () => { toast.success('Password changed'); reset(); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Change failed'),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Change Password</h3>
      {(['old_password', 'new_password', 'confirm_new_password'] as const).map((field) => (
        <div key={field} className="space-y-2">
          <Label htmlFor={field}>{field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</Label>
          <Input id={field} type="password" {...register(field)} />
          {errors[field] && <p className="text-xs text-destructive">{errors[field]?.message}</p>}
        </div>
      ))}
      <Button type="submit" disabled={mutation.isPending} size="sm">
        {mutation.isPending ? 'Updating…' : 'Update Password'}
      </Button>
    </form>
  );
}

function SessionsSection() {
  const qc = useQueryClient();
  const { data: sessions, isLoading } = useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn: () => api.get('/users/me/sessions'),
  });

  const revokeOne = useMutation({
    mutationFn: (id: string) => api.delete(`/users/me/sessions/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sessions'] }); toast.success('Session revoked'); },
    onError: () => toast.error('Revoke failed'),
  });

  const revokeAll = useMutation({
    mutationFn: () => api.post('/users/me/sessions/revoke-all'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sessions'] }); toast.success('All other sessions revoked'); },
    onError: () => toast.error('Revoke failed'),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Active Sessions</h3>
        <Button variant="outline" size="sm" onClick={() => revokeAll.mutate()} disabled={revokeAll.isPending}>
          Revoke all other
        </Button>
      </div>
      {isLoading && <Skeleton className="h-16 w-full rounded-md" />}
      {sessions?.map((s) => (
        <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card text-sm">
          <div>
            <p className="font-medium">{s.device}</p>
            <p className="text-xs text-muted-foreground">{s.ip} · {relTime(s.last_seen)}</p>
          </div>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
            onClick={() => revokeOne.mutate(s.id)} disabled={revokeOne.isPending}>
            Revoke
          </Button>
        </div>
      ))}
    </div>
  );
}

function DangerZone() {
  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  const deleteMutation = useMutation({
    mutationFn: () => api.post('/users/me/delete', { email_confirm: confirmEmail }),
    onSuccess: () => { logout(); navigate('/login'); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Delete failed'),
  });

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
      <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
        <p className="text-sm text-foreground mb-3">
          Permanently delete your account. This action cannot be undone.
        </p>
        <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
          Delete my account
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This will permanently delete your account and all data. Enter your email to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Your email: <span className="font-mono text-xs">{user?.email}</span></Label>
            <Input value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Re-enter your email" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive"
              disabled={confirmEmail !== user?.email || deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}>
              {deleteMutation.isPending ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Account() {
  return (
    <div className="space-y-8 max-w-lg">
      <h2 className="text-2xl font-semibold" style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic' }}>
        Account
      </h2>
      <ProfileSection />
      <Separator />
      <PasswordSection />
      <Separator />
      <SessionsSection />
      <Separator />
      <DangerZone />
    </div>
  );
}
