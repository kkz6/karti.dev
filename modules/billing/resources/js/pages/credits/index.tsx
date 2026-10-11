import { Head, Link } from '@inertiajs/react';
import { AdminPageContent } from '@shared/components/admin-page-content';
import { IndexHeader } from '@shared/components/index-header';
import { Button } from '@shared/components/ui/button';
import AppLayout from '@shared/layouts/app-layout';
import { InertiaTableWrapper, type TableConfig } from '@table/components';
import { ArrowUpRight, FileMinus2 } from 'lucide-react';
export default function CreditIndex({ table, canViewInvoices }: { table: TableConfig; canViewInvoices: boolean }) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Credit notes', href: route('admin.credit-notes.index') }]}>
            <Head title="Credit notes" />
            <AdminPageContent>
                <IndexHeader
                    title="Credit notes"
                    icon={FileMinus2}
                    actions={
                        canViewInvoices ? (
                            <Button asChild>
                                <Link href={route('admin.invoices.index')}>
                                    <ArrowUpRight />
                                    Open invoices
                                </Link>
                            </Button>
                        ) : undefined
                    }
                    description={<> Manage customer credits, invoice allocations and recorded refunds. Create a credit from an issued invoice. </>}
                />
                <InertiaTableWrapper
                    resource={table}
                    emptyState={{
                        title: 'No credit notes yet',
                        description: 'Open an issued invoice and create a credit when a customer needs an adjustment.',
                        icons: [FileMinus2],
                    }}
                />
            </AdminPageContent>
        </AppLayout>
    );
}
