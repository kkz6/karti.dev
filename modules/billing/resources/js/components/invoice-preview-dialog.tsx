import { Link } from '@inertiajs/react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { statusTone } from '@shared/lib/status-colors';
import { ArrowRight, FileDown, Pencil, Receipt } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { InvoiceData } from '../invoice-types';
import type IssuedInvoice from '../pages/invoices/show';
import { InvoicePreview } from './invoice-preview';

export type InvoiceViewData = Partial<Parameters<typeof IssuedInvoice>[0]> & {
    invoice: InvoiceData;
    draft?: boolean;
    canUpdate?: boolean;
    canIssue?: boolean;
};

export function InvoicePreviewDialog({ data, onClose, onEdit }: { data: InvoiceViewData; onClose: () => void; onEdit: (id: number) => void }) {
    const [open, setOpen] = useState(true);
    useEffect(() => {
        if (open) return;
        const timer = setTimeout(onClose, 200);
        return () => clearTimeout(timer);
    }, [open, onClose]);
    const invoice = data.invoice;
    const state = data.draft
        ? 'Draft'
        : invoice.status === 'cancelled'
          ? 'Cancelled'
          : data.settlement?.state === 'paid'
            ? 'Paid'
            : data.settlement?.state === 'partial'
              ? 'Partially paid'
              : data.settlement?.state === 'settled'
                ? 'Settled'
                : 'Unpaid';
    return (
        <Dialog
            open={open}
            onOpenChange={(open) => {
                if (!open) setOpen(false);
            }}
        >
            <DialogContent
                overlayClassName="bg-black/45"
                className="invoice-preview-modal bg-card flex max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-[850px]"
                onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    document.getElementById('invoice-list-heading')?.focus({ preventScroll: true });
                }}
            >
                <DialogHeader className="bg-card border-b p-4 pr-12 text-left">
                    <div className="flex items-center gap-3">
                        <div className="bg-card grid size-10 shrink-0 place-items-center rounded-lg">
                            <Receipt className="text-muted-foreground size-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <DialogTitle>{invoice.formatted_number ?? `Draft #${invoice.id}`}</DialogTitle>
                                <Badge variant={statusTone(state)}>{state}</Badge>
                            </div>
                            <DialogDescription className="mt-1">
                                {invoice.customer_snapshot.legal_name || invoice.customer_snapshot.display_name}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <div className="bg-card min-h-0 flex-1 overflow-y-auto p-3 sm:p-5" aria-label="Invoice preview document">
                    <InvoicePreview invoice={invoice} settlement={data.settlement} className="rounded-lg border shadow-none" />
                </div>
                <DialogFooter className="bg-card items-center border-t p-4 sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                        {data.canDownloadPdf && (
                            <Button variant="outline" asChild>
                                <a href={route('admin.invoices.pdf', { invoice: invoice.id, download: 1 })}>
                                    <FileDown />
                                    Download PDF
                                </a>
                            </Button>
                        )}
                        {data.draft && data.canUpdate && (
                            <Button variant="outline" onClick={() => onEdit(invoice.id)}>
                                <Pencil />
                                Edit draft
                            </Button>
                        )}
                    </div>
                    <Button asChild>
                        <Link href={route(data.draft && data.canUpdate ? 'admin.invoices.edit' : 'admin.invoices.show', invoice.id)}>
                            Full details
                            <ArrowRight />
                        </Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
