import { Head } from '@inertiajs/react';
import { AdminPageContent } from '@shared/components/admin-page-content';
import { IndexHeader } from '@shared/components/index-header';
import { Button } from '@shared/components/ui/button';
import AppLayout from '@shared/layouts/app-layout';
import { InertiaTableWrapper, type TableConfig } from '@table/components';
import { Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { BillingCreateModal } from '../../components/billing-create-modal';

export default function Customers({ table, canCreate }: { table: TableConfig; canCreate: boolean }) {
    const [creating, setCreating] = useState(false);
    return (
        <AppLayout breadcrumbs={[{ title: 'Customers', href: route('admin.customers.index') }]}>
            <Head title="Customers" />
            <AdminPageContent>
                <IndexHeader
                    title="Customers"
                    icon={Users}
                    actions={
                        canCreate ? (
                            <Button onClick={() => setCreating(true)}>
                                <Plus />
                                Add customer
                            </Button>
                        ) : undefined
                    }
                    description={<> Manage customer details and billing contacts. Use the status filter to find archived customers. </>}
                />

                <InertiaTableWrapper
                    resource={table}
                    emptyState={{
                        title: 'No customers yet',
                        description: 'Add your first customer to start managing invoices and payments.',
                        icons: [Users],
                        action: canCreate ? { label: 'Add customer', onClick: () => setCreating(true) } : undefined,
                    }}
                />
            </AdminPageContent>
            <BillingCreateModal kind="customer" open={creating} onClose={() => setCreating(false)} />
        </AppLayout>
    );
}
