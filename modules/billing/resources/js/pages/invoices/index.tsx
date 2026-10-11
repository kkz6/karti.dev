import { Head, router } from '@inertiajs/react';
import { AdminPageContent } from '@shared/components/admin-page-content';
import { IndexHeader } from '@shared/components/index-header';
import { Button } from '@shared/components/ui/button';
import AppLayout from '@shared/layouts/app-layout';
import { InertiaTableWrapper, type TableConfig } from '@table/components';
import { Receipt } from 'lucide-react';
import { useState } from 'react';
import { InvoiceComposer } from '../../components/invoice-composer';
import { InvoiceNotification } from '../../components/invoice-notification';
import { InvoicePreviewDialog, type InvoiceViewData } from '../../components/invoice-preview-dialog';

export default function InvoiceIndex({
    table,
    canCreate,
    openComposer = false,
    selectedInvoice,
    editInvoiceId,
}: {
    table: TableConfig;
    canCreate: boolean;
    openComposer?: boolean;
    selectedInvoice?: InvoiceViewData | null;
    editInvoiceId?: number | null;
}) {
    const [editingId, setEditingId] = useState<number | undefined>(editInvoiceId ?? undefined);
    const selectInvoice = (id: number | null, after?: () => void) => {
        const url = new URL(window.location.href);
        if (id) {
            url.searchParams.set('invoice', String(id));
        } else url.searchParams.delete('invoice');
        router.get(url.pathname + url.search, {}, { preserveState: true, preserveScroll: true, replace: true, onSuccess: after });
    };
    const [composing, setComposing] = useState(!!editInvoiceId || (openComposer && canCreate));
    return (
        <AppLayout breadcrumbs={[{ title: 'Invoices', href: route('admin.invoices.index') }]}>
            <Head title="Invoices" />
            <InvoiceNotification message={selectedInvoice?.message} response={selectedInvoice} />
            <AdminPageContent>
                <IndexHeader
                    title="Invoices"
                    icon={Receipt}
                    actions={
                        <>
                            {canCreate && (
                                <Button
                                    onClick={() => {
                                        setEditingId(undefined);
                                        setComposing(true);
                                    }}
                                >
                                    Create invoice
                                </Button>
                            )}
                        </>
                    }
                    description={<> Manage drafts, issued invoices and cancellations. Permanent numbers are assigned on issuance. </>}
                />

                <div id="invoice-list-heading" tabIndex={-1} className="invoice-list min-w-0 outline-none">
                    <InertiaTableWrapper
                        resource={table}
                        onCustomAction={(action, keys, onFinish) => {
                            const id = Number(keys[0]);
                            if (id) {
                                if (action.id === 'invoice-edit') {
                                    setEditingId(id);
                                    setComposing(true);
                                } else if (action.id === 'invoice-pdf')
                                    window.location.assign(route('admin.invoices.pdf', { invoice: id, download: 1 }));
                                else if (['invoice-details', 'invoice-payments', 'invoice-sharing'].includes(action.id)) {
                                    const tab =
                                        action.id === 'invoice-payments' ? 'payments' : action.id === 'invoice-sharing' ? 'sharing' : 'overview';
                                    const row = table.results?.data.find((item) => Number(item._primary_key) === id);
                                    const editableDraft =
                                        (typeof row?.status === 'object' ? row.status?.value : row?.status) === 'Draft' &&
                                        table.actions?.some((a) => a.id === 'invoice-edit' && a.authorized);
                                    const destination =
                                        action.id === 'invoice-details' && editableDraft
                                            ? route('admin.invoices.edit', id)
                                            : route('admin.invoices.show', id) + '?tab=' + tab;
                                    router.visit(destination);
                                } else selectInvoice(id);
                            }
                            onFinish?.();
                        }}
                        onRowClick={(item) => {
                            if (item._primary_key) selectInvoice(Number(item._primary_key));
                        }}
                        emptyState={{
                            title: 'No invoices yet',
                            description: 'Create your first invoice draft, add its items and review it before issuing.',
                            icons: [Receipt],
                            action: canCreate ? { label: 'Create invoice', onClick: () => setComposing(true) } : undefined,
                        }}
                    />
                </div>
            </AdminPageContent>
            {selectedInvoice && (
                <InvoicePreviewDialog
                    data={selectedInvoice}
                    onClose={() => selectInvoice(null)}
                    onEdit={(id) =>
                        selectInvoice(null, () => {
                            setEditingId(id);
                            setComposing(true);
                        })
                    }
                />
            )}
            <InvoiceComposer
                invoiceId={editingId}
                open={composing}
                onClose={() => {
                    setComposing(false);
                    const url = new URL(window.location.href);
                    if (url.searchParams.has('edit') || url.searchParams.has('compose')) {
                        url.searchParams.delete('edit');
                        url.searchParams.delete('compose');
                        router.get(url.pathname + url.search, {}, { preserveState: true, preserveScroll: true, replace: true });
                    }
                }}
            />
        </AppLayout>
    );
}
