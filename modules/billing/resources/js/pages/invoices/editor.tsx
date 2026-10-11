import { Head, router } from '@inertiajs/react';
import AppLayout from '@shared/layouts/app-layout';
import { InvoiceComposer } from '../../components/invoice-composer';

/** Editors without list permission use the same modal without exposing the table. */
export default function InvoiceEditor({ invoiceId }: { invoiceId: number }) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Edit invoice', href: route('admin.invoices.edit', invoiceId) }]}>
            <Head title="Edit invoice" />
            <InvoiceComposer invoiceId={invoiceId} open onClose={() => router.visit(route('dashboard'))} />
        </AppLayout>
    );
}
