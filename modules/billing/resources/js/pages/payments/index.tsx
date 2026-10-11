import { Head } from '@inertiajs/react';
import { AdminPageContent } from '@shared/components/admin-page-content';
import { IndexHeader } from '@shared/components/index-header';
import AppLayout from '@shared/layouts/app-layout';
import { InertiaTableWrapper, type TableConfig } from '@table/components';
import { Banknote } from 'lucide-react';
export default function Payments({ table }: { table: TableConfig }) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Payments', href: route('admin.payments.index') }]}>
            <Head title="Payments" />
            <AdminPageContent>
                <IndexHeader
                    title="Payments"
                    icon={Banknote}
                    description={<> Manual payments and reversals. Open the invoice to record or reverse a payment. </>}
                />

                <InertiaTableWrapper
                    resource={table}
                    emptyState={{
                        title: 'No payments found',
                        description: 'Record a payment on an issued invoice or adjust your filters.',
                        icons: [Banknote],
                    }}
                />
            </AdminPageContent>
        </AppLayout>
    );
}
