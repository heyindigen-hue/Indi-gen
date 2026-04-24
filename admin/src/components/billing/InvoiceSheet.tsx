import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DownloadIcon, UploadIcon } from '@/icons';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { formatINR, relTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/common/StatusPill';
import type { StatusPillVariant } from '@/components/common/StatusPill';

type LineItem = {
  description: string;
  hsn: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export type InvoiceDetail = {
  id: string;
  invoice_number: string;
  status: 'paid' | 'pending' | 'void';
  issued_at: string;
  customer_name: string;
  customer_gstin: string | null;
  customer_address: string | null;
  line_items: LineItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  tds_deducted: number | null;
  tds_certificate_url: string | null;
  pdf_url: string | null;
};

const STATUS_VARIANTS: Record<string, StatusPillVariant> = {
  paid: 'success',
  pending: 'warning',
  void: 'muted',
};

interface InvoiceSheetProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceSheet({ invoiceId, open, onOpenChange }: InvoiceSheetProps) {
  const [tdsInput, setTdsInput] = useState('');
  const qc = useQueryClient();

  const { data: invoice, isLoading } = useQuery<InvoiceDetail>({
    queryKey: ['admin-invoice', invoiceId],
    queryFn: () => api.get<InvoiceDetail>(`/admin/invoices/${invoiceId}`),
    enabled: !!invoiceId && open,
  });

  const tdsMutation = useMutation({
    mutationFn: (tds: number) => api.patch(`/admin/invoices/${invoiceId}`, { tds_deducted: tds }),
    onSuccess: () => {
      toast.success('TDS updated');
      setTdsInput('');
      qc.invalidateQueries({ queryKey: ['admin-invoice', invoiceId] });
      qc.invalidateQueries({ queryKey: ['admin-invoices'] });
    },
    onError: () => toast.error('Failed to update TDS'),
  });

  const handleDownloadIconPdf = () => {
    if (invoice?.pdf_url) {
      window.open(invoice.pdf_url, '_blank');
      return;
    }
    api
      .get<{ url: string }>(`/admin/invoices/${invoiceId}/pdf`)
      .then((res) => window.open((res as { url: string }).url, '_blank'))
      .catch(() => toast.error('Failed to get PDF'));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {isLoading || !invoice ? (
          <div className="space-y-4 pt-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <div className="space-y-6 py-2">
            <SheetHeader>
              <div className="flex items-start justify-between">
                <div>
                  <SheetTitle className="text-lg">{invoice.invoice_number}</SheetTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Issued {relTime(invoice.issued_at)}
                  </p>
                </div>
                <StatusPill
                  label={invoice.status}
                  variant={STATUS_VARIANTS[invoice.status] ?? 'default'}
                />
              </div>
            </SheetHeader>

            {/* Billing to */}
            <div className="rounded-md bg-muted/50 p-4 space-y-1 text-sm">
              <p className="font-medium text-foreground">Billing To</p>
              <p className="text-foreground">{invoice.customer_name}</p>
              {invoice.customer_gstin && (
                <p className="text-muted-foreground">GSTIN: {invoice.customer_gstin}</p>
              )}
              {invoice.customer_address && (
                <p className="text-muted-foreground whitespace-pre-line">
                  {invoice.customer_address}
                </p>
              )}
            </div>

            {/* Line items */}
            <div>
              <p className="text-sm font-medium mb-2">Line Items</p>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">
                        Description
                      </th>
                      <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">
                        HSN
                      </th>
                      <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium">
                        Qty
                      </th>
                      <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium">
                        Unit
                      </th>
                      <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.line_items.map((item, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{item.description}</td>
                        <td className="px-3 py-2 text-muted-foreground">{item.hsn || '998314'}</td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">{formatINR(item.unit_price)}</td>
                        <td className="px-3 py-2 text-right font-medium">
                          {formatINR(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tax breakdown */}
            <div className="space-y-2 text-sm">
              <p className="font-medium">Tax Breakdown (HSN 998314)</p>
              <div className="space-y-1.5 rounded-md border p-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatINR(invoice.subtotal)}</span>
                </div>
                {invoice.cgst > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CGST (9%)</span>
                    <span>{formatINR(invoice.cgst)}</span>
                  </div>
                )}
                {invoice.sgst > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SGST (9%)</span>
                    <span>{formatINR(invoice.sgst)}</span>
                  </div>
                )}
                {invoice.igst > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IGST (18%)</span>
                    <span>{formatINR(invoice.igst)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatINR(invoice.total)}</span>
                </div>
              </div>
            </div>

            {/* TDS */}
            <div className="space-y-3 rounded-md border p-4">
              <p className="text-sm font-medium">TDS Deducted</p>
              {invoice.tds_deducted != null && (
                <p className="text-sm text-muted-foreground">
                  Current: {formatINR(invoice.tds_deducted)}
                </p>
              )}
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Update amount (&#8377;)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={tdsInput}
                    onChange={(e) => setTdsInput(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  disabled={!tdsInput || tdsMutation.isPending}
                  onClick={() => tdsMutation.mutate(Number(tdsInput))}
                >
                  {tdsMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
              {invoice.tds_certificate_url ? (
                <a
                  href={invoice.tds_certificate_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <DownloadIcon className="h-3 w-3" />
                  View TDS certificate
                </a>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => toast.info('UploadIcon TDS certificate')}
                >
                  <UploadIcon className="h-3.5 w-3.5 mr-1" />
                  UploadIcon TDS certificate
                </Button>
              )}
            </div>

            {/* DownloadIcon PDF */}
            <Button className="w-full" variant="outline" onClick={handleDownloadIconPdf}>
              <DownloadIcon className="h-4 w-4 mr-2" />
              DownloadIcon PDF
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
