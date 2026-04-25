import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { relTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrashIcon, EyeIcon } from '@/icons';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

type Proposal = {
  id: string;
  lead_name: string;
  lead_company: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type StatusVariant = 'secondary' | 'default' | 'warning' | 'success' | 'destructive' | 'outline';

function getStatusVariant(status: string): StatusVariant {
  const map: Record<string, StatusVariant> = {
    draft: 'secondary',
    sent: 'default',
    viewed: 'warning',
    accepted: 'success',
    rejected: 'destructive',
  };
  return map[status] ?? 'outline';
}

export default function Proposals() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: proposals, isLoading } = useQuery<Proposal[]>({
    queryKey: ['proposals'],
    queryFn: () => api.get<Proposal[]>('/proposals'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/proposals/${id}`),
    onSuccess: () => {
      toast.success('Proposal deleted');
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete proposal'),
  });

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-['Fraunces'] italic text-2xl font-bold">Proposals</h1>
      </div>

      <div className="rounded-lg border">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !proposals || proposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ProposalsEmptyIcon />
            </div>
            <p className="text-sm font-medium">No proposals yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Open a lead and create a proposal to get started.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((proposal) => (
                <TableRow
                  key={proposal.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/proposals/${proposal.id}`)}
                >
                  <TableCell className="font-medium">{proposal.lead_name}</TableCell>
                  <TableCell>{proposal.lead_company}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(proposal.status)} className="capitalize">
                      {proposal.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {relTime(proposal.created_at)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {relTime(proposal.updated_at)}
                  </TableCell>
                  <TableCell>
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/proposals/${proposal.id}`)}
                      >
                        <EyeIcon size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(proposal.id)}
                      >
                        <TrashIcon size={15} className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Delete dialog */}
      <Dialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Proposal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this proposal? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteId) deleteMutation.mutate(deleteId);
              }}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProposalsEmptyIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      className="text-muted-foreground"
    >
      <rect
        x="6"
        y="4"
        width="20"
        height="24"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M10 10h12M10 15h12M10 20h7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
