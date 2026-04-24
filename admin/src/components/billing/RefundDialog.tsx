import { useState } from 'react';
import { AlertCircleIcon } from '@/icons';
import { formatINR, relTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export type RefundRequest = {
  id: string;
  user_name: string;
  user_email: string;
  invoice_number: string;
  amount: number;
  reason: string;
  requested_by: string;
  requested_by_email: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string | null;
  processed_at?: string | null;
  processed_by?: string | null;
};

interface RefundDialogProps {
  request: RefundRequest | null;
  action: 'approve' | 'reject';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string, action: 'approve' | 'reject', note: string) => void;
  isPending?: boolean;
}

export function RefundDialog({
  request,
  action,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: RefundDialogProps) {
  const [note, setNote] = useState('');

  if (!request) return null;

  const highValue = request.amount > 5000;

  const handleClose = (v: boolean) => {
    onOpenChange(v);
    if (!v) setNote('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle
            className={cn(action === 'reject' && 'text-destructive')}
          >
            {action === 'approve' ? 'Approve Refund' : 'Reject Refund'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {highValue && (
            <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-300">
              <AlertCircleIcon size={16} className="shrink-0 mt-0.5" />
              <span>
                Amount exceeds &#8377;5,000 — this refund requires second admin approval.
              </span>
            </div>
          )}

          <div className="space-y-2 rounded-md bg-muted/50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer</span>
              <span className="font-medium">{request.user_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice</span>
              <span className="font-mono text-xs">{request.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">{formatINR(request.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Requested by</span>
              <span>{request.requested_by}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Requested</span>
              <span>{relTime(request.requested_at)}</span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <span className="text-muted-foreground shrink-0">Reason</span>
              <span className="text-right">{request.reason}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Note (optional)</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              placeholder={
                action === 'approve' ? 'Add approval note...' : 'Add rejection reason...'
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            variant={action === 'reject' ? 'destructive' : 'default'}
            disabled={isPending}
            onClick={() => onConfirm(request.id, action, note)}
          >
            {isPending
              ? 'Processing...'
              : action === 'approve'
              ? 'Approve Refund'
              : 'Reject Refund'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
