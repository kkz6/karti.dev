import { Head } from '@inertiajs/react';
import { AdminPageContent } from '@shared/components/admin-page-content';
import { IndexHeader } from '@shared/components/index-header';
import { Button } from '@shared/components/ui/button';
import AppLayout from '@shared/layouts/app-layout';
import { InertiaTableWrapper, type TableConfig } from '@table/components';
import { Plus, Repeat2 } from 'lucide-react';
import { useState } from 'react';
import { BillingCreateModal } from '../../components/billing-create-modal';
export type RecurringSchedule = {
    id: number;
    name: string;
    source_invoice_id: number;
    interval: string;
    every: number;
    timezone: string;
    anchor_date: string;
    next_date: string;
    due_days: number;
    cycle_limit: number | null;
    cycles_done: number;
    policy: string;
    active: boolean;
    version: number;
    last_error: string | null;
};
export default function RecurringIndex({ table, canCreate }: { table: TableConfig; canCreate: boolean }) {
    const [creating, setCreating] = useState(false);
    return (
        <AppLayout breadcrumbs={[{ title: 'Recurring invoices', href: route('admin.recurring-invoices.index') }]}>
            <Head title="Recurring invoices" />
            <AdminPageContent>
                <IndexHeader
                    title="Recurring invoices"
                    icon={Repeat2}
                    actions={
                        canCreate ? (
                            <Button onClick={() => setCreating(true)}>
                                <Plus />
                                Create schedule
                            </Button>
                        ) : undefined
                    }
                    description={
                        <>
                            {' '}
                            Automate repeat billing from an invoice template. Choose whether each cycle creates a draft, issues an invoice or sends it
                            by email.{' '}
                        </>
                    }
                />
                <InertiaTableWrapper
                    resource={table}
                    emptyState={{
                        title: 'No recurring schedules yet',
                        description: 'Create a schedule from an existing invoice to start repeat billing.',
                        icons: [Repeat2],
                    }}
                />
            </AdminPageContent>
            <BillingCreateModal kind="recurring" open={creating} onClose={() => setCreating(false)} />
        </AppLayout>
    );
}
